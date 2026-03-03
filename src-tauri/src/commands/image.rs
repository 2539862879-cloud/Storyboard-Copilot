use base64::{engine::general_purpose::STANDARD, Engine};
use image::GenericImageView;
use md5;
use std::io::Cursor;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};
use tracing::info;

#[tauri::command]
pub async fn split_image(
    image_base64: String,
    rows: u32,
    cols: u32,
) -> Result<Vec<String>, String> {
    info!("Splitting image into {}x{}", rows, cols);

    let image_data = STANDARD
        .decode(&image_base64)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let img =
        image::load_from_memory(&image_data).map_err(|e| format!("Failed to load image: {}", e))?;

    let (width, height) = img.dimensions();
    let cell_width = width / cols;
    let cell_height = height / rows;

    let mut results = Vec::new();

    for row in 0..rows {
        for col in 0..cols {
            let x = col * cell_width;
            let y = row * cell_height;

            let cropped = img.crop_imm(x, y, cell_width, cell_height);

            let mut buffer = Cursor::new(Vec::new());
            cropped
                .write_to(&mut buffer, image::ImageFormat::Png)
                .map_err(|e| format!("Failed to encode cropped image: {}", e))?;

            let base64_data = STANDARD.encode(buffer.get_ref());
            results.push(format!("data:image/png;base64,{}", base64_data));
        }
    }

    info!("Split into {} images", results.len());
    Ok(results)
}

fn resolve_images_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to resolve app data dir: {}", e))?;

    let images_dir = app_data_dir.join("images");
    std::fs::create_dir_all(&images_dir)
        .map_err(|e| format!("Failed to create images dir: {}", e))?;

    Ok(images_dir)
}

fn normalize_extension(raw_ext: &str) -> String {
    let ext = raw_ext.trim().trim_start_matches('.').to_ascii_lowercase();
    if ext.is_empty() {
        return "png".to_string();
    }

    if ext == "jpeg" {
        return "jpg".to_string();
    }

    ext
}

fn extension_from_mime(mime: &str) -> String {
    let normalized = mime.trim().to_ascii_lowercase();
    match normalized.as_str() {
        "image/png" => "png".to_string(),
        "image/jpeg" => "jpg".to_string(),
        "image/jpg" => "jpg".to_string(),
        "image/webp" => "webp".to_string(),
        "image/gif" => "gif".to_string(),
        "image/bmp" => "bmp".to_string(),
        "image/avif" => "avif".to_string(),
        _ => "png".to_string(),
    }
}

fn extension_from_path_like(value: &str) -> Option<String> {
    let cleaned = value
        .split('#')
        .next()
        .unwrap_or(value)
        .split('?')
        .next()
        .unwrap_or(value);
    let ext = Path::new(cleaned)
        .extension()
        .and_then(|item| item.to_str())
        .map(normalize_extension)?;

    Some(ext)
}

fn parse_data_url(source: &str) -> Result<(Vec<u8>, String), String> {
    let (meta, payload) = source
        .split_once(',')
        .ok_or_else(|| "Invalid data URL format".to_string())?;

    if !meta.starts_with("data:") || !meta.ends_with(";base64") {
        return Err("Only base64 data URL is supported".to_string());
    }

    let mime = meta
        .strip_prefix("data:")
        .and_then(|v| v.strip_suffix(";base64"))
        .unwrap_or("image/png");

    let bytes = STANDARD
        .decode(payload)
        .map_err(|e| format!("Failed to decode data URL: {}", e))?;

    Ok((bytes, extension_from_mime(mime)))
}

async fn resolve_source_bytes(source: &str) -> Result<(Vec<u8>, String), String> {
    if source.starts_with("data:") {
        return parse_data_url(source);
    }

    if source.starts_with("http://") || source.starts_with("https://") {
        let response = reqwest::get(source)
            .await
            .map_err(|e| format!("Failed to download remote image: {}", e))?;

        if !response.status().is_success() {
            return Err(format!(
                "Remote image request failed with status {}",
                response.status()
            ));
        }

        let mime_ext = response
            .headers()
            .get(reqwest::header::CONTENT_TYPE)
            .and_then(|value| value.to_str().ok())
            .map(extension_from_mime);

        let bytes = response
            .bytes()
            .await
            .map_err(|e| format!("Failed to read remote image body: {}", e))?
            .to_vec();

        let ext = mime_ext
            .or_else(|| extension_from_path_like(source))
            .unwrap_or_else(|| "png".to_string());

        return Ok((bytes, ext));
    }

    if source.starts_with("file://") {
        let file_path = source.trim_start_matches("file://");
        let local_path = PathBuf::from(file_path);
        let bytes = std::fs::read(&local_path)
            .map_err(|e| format!("Failed to read file:// image source: {}", e))?;
        let ext = local_path
            .extension()
            .and_then(|item| item.to_str())
            .map(normalize_extension)
            .unwrap_or_else(|| "png".to_string());
        return Ok((bytes, ext));
    }

    let local_path = PathBuf::from(source);
    let bytes = std::fs::read(&local_path)
        .map_err(|e| format!("Failed to read local image source: {}", e))?;
    let ext = local_path
        .extension()
        .and_then(|item| item.to_str())
        .map(normalize_extension)
        .unwrap_or_else(|| "png".to_string());

    Ok((bytes, ext))
}

#[tauri::command]
pub async fn persist_image_source(app: AppHandle, source: String) -> Result<String, String> {
    let trimmed = source.trim();
    if trimmed.is_empty() {
        return Err("Image source is empty".to_string());
    }

    let (bytes, extension) = resolve_source_bytes(trimmed).await?;
    let images_dir = resolve_images_dir(&app)?;
    let digest = md5::compute(&bytes);
    let filename = format!("{:x}.{}", digest, extension);
    let output_path = images_dir.join(filename);

    if !output_path.exists() {
        std::fs::write(&output_path, bytes)
            .map_err(|e| format!("Failed to persist image source: {}", e))?;
    }

    Ok(output_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn load_image(file_path: String) -> Result<String, String> {
    info!("Loading image from: {}", file_path);

    let image_data =
        std::fs::read(&file_path).map_err(|e| format!("Failed to read file: {}", e))?;

    let base64_data = STANDARD.encode(&image_data);

    let mime = if file_path.ends_with(".png") {
        "image/png"
    } else if file_path.ends_with(".jpg") || file_path.ends_with(".jpeg") {
        "image/jpeg"
    } else if file_path.ends_with(".gif") {
        "image/gif"
    } else if file_path.ends_with(".webp") {
        "image/webp"
    } else {
        "image/png"
    };

    Ok(format!("data:{};base64,{}", mime, base64_data))
}
