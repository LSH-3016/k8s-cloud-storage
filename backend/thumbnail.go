package main

import (
	"bytes"
	"image"
	"image/gif"
	"image/jpeg"
	"image/png"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/nfnt/resize"
)

// getThumbnail - 이미지/비디오 썸네일 생성
func getThumbnail(c *gin.Context) {
	username := c.Query("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	path := c.Query("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Path is required"})
		return
	}

	userRoot, _ := getUserRoot(username)
	fullPath := filepath.Join(userRoot, path)

	if !validateUserPath(fullPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	ext := strings.ToLower(filepath.Ext(fullPath))

	// 이미지 파일 썸네일
	if isImageFile(ext) {
		thumbnail, err := generateImageThumbnail(fullPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "image/jpeg", thumbnail)
		return
	}

	// 비디오 파일 썸네일
	if isVideoFile(ext) {
		thumbnail, err := generateVideoThumbnail(fullPath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.Data(http.StatusOK, "image/jpeg", thumbnail)
		return
	}

	c.JSON(http.StatusBadRequest, gin.H{"error": "Unsupported file type"})
}

func isImageFile(ext string) bool {
	imageExts := []string{".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif", ".ico", ".heic", ".heif"}
	for _, e := range imageExts {
		if ext == e {
			return true
		}
	}
	return false
}

func isVideoFile(ext string) bool {
	videoExts := []string{".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm", ".m4v", ".mpg", ".mpeg", ".3gp", ".ts", ".mts"}
	for _, e := range videoExts {
		if ext == e {
			return true
		}
	}
	return false
}

func generateImageThumbnail(filePath string) ([]byte, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// 이미지 디코딩
	var img image.Image
	ext := strings.ToLower(filepath.Ext(filePath))

	switch ext {
	case ".jpg", ".jpeg":
		img, err = jpeg.Decode(file)
	case ".png":
		img, err = png.Decode(file)
	case ".gif":
		// GIF의 첫 프레임만 가져오기
		gifImg, err := gif.DecodeAll(file)
		if err != nil {
			return nil, err
		}
		if len(gifImg.Image) > 0 {
			img = gifImg.Image[0]
		} else {
			return nil, err
		}
	default:
		img, _, err = image.Decode(file)
	}

	if err != nil {
		return nil, err
	}

	// 썸네일 크기로 리사이즈 (최대 300px)
	thumbnail := resize.Thumbnail(300, 300, img, resize.Lanczos3)

	// JPEG로 인코딩
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, thumbnail, &jpeg.Options{Quality: 85}); err != nil {
		return nil, err
	}

	return buf.Bytes(), nil
}

func generateVideoThumbnail(filePath string) ([]byte, error) {
	// ffmpeg를 사용하여 비디오 썸네일 생성
	tmpFile := filepath.Join(os.TempDir(), "thumb_"+filepath.Base(filePath)+".jpg")
	defer os.Remove(tmpFile)

	cmd := exec.Command("ffmpeg",
		"-i", filePath,
		"-ss", "00:00:03.000", // 3초 지점에서 캡처 (인트로 건너뛰기)
		"-vframes", "1",
		"-vf", "scale=300:-1",
		"-q:v", "2", // 품질 향상 (1-31, 낮을수록 좋음)
		tmpFile,
	)

	if err := cmd.Run(); err != nil {
		return nil, err
	}

	return os.ReadFile(tmpFile)
}
