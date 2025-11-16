package main

import (
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

var nasRoot = os.Getenv("NAS_ROOT")

type FileInfo struct {
	Name      string `json:"name"`
	Path      string `json:"path"`
	Size      int64  `json:"size"`
	IsDir     bool   `json:"isDir"`
	ModTime   string `json:"modTime"`
	Extension string `json:"extension"`
}

// getUserRoot - 사용자별 루트 디렉토리 반환 및 생성
func getUserRoot(username string) (string, error) {
	userRoot := filepath.Join(nasRoot, username)
	if _, err := os.Stat(userRoot); os.IsNotExist(err) {
		if err := os.MkdirAll(userRoot, 0755); err != nil {
			return "", err
		}
	}
	return userRoot, nil
}

// validateUserPath - 사용자 폴더 내 경로인지 검증
func validateUserPath(fullPath, userRoot string) bool {
	return strings.HasPrefix(filepath.Clean(fullPath), userRoot)
}

// listFiles - 디렉토리 파일 목록 조회
func listFiles(c *gin.Context) {
	username := c.Query("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	path := c.Query("path")
	if path == "" {
		path = "/"
	}

	userRoot, err := getUserRoot(username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user directory"})
		return
	}

	fullPath := filepath.Join(userRoot, path)

	if !validateUserPath(fullPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	entries, err := os.ReadDir(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}

		ext := ""
		if !entry.IsDir() {
			ext = strings.ToLower(filepath.Ext(entry.Name()))
		}

		files = append(files, FileInfo{
			Name:      entry.Name(),
			Path:      filepath.Join(path, entry.Name()),
			Size:      info.Size(),
			IsDir:     entry.IsDir(),
			ModTime:   info.ModTime().Format("2006-01-02 15:04:05"),
			Extension: ext,
		})
	}

	c.JSON(http.StatusOK, gin.H{"files": files, "currentPath": path})
}

// downloadFile - 파일 다운로드
func downloadFile(c *gin.Context) {
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

	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	c.File(fullPath)
}

// uploadFile - 파일 업로드
func uploadFile(c *gin.Context) {
	username := c.PostForm("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	path := c.PostForm("path")
	if path == "" {
		path = "/"
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	userRoot, _ := getUserRoot(username)
	uploadPath := filepath.Join(userRoot, path)

	if !validateUserPath(uploadPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
		return
	}

	dst := filepath.Join(uploadPath, file.Filename)
	if err := c.SaveUploadedFile(file, dst); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "File uploaded successfully", "filename": file.Filename})
}

// deleteFile - 파일/폴더 삭제
func deleteFile(c *gin.Context) {
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

	if err := os.RemoveAll(fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Deleted successfully"})
}

// moveFile - 파일/폴더 이동
func moveFile(c *gin.Context) {
	username := c.PostForm("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	src := c.PostForm("src")
	dst := c.PostForm("dst")

	if src == "" || dst == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Source and destination required"})
		return
	}

	userRoot, _ := getUserRoot(username)
	srcPath := filepath.Join(userRoot, src)
	dstPath := filepath.Join(userRoot, dst)

	if !validateUserPath(srcPath, userRoot) || !validateUserPath(dstPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	if err := os.Rename(srcPath, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Moved successfully"})
}

// copyFile - 파일/폴더 복사
func copyFile(c *gin.Context) {
	username := c.PostForm("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	src := c.PostForm("src")
	dst := c.PostForm("dst")

	if src == "" || dst == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Source and destination required"})
		return
	}

	userRoot, _ := getUserRoot(username)
	srcPath := filepath.Join(userRoot, src)
	dstPath := filepath.Join(userRoot, dst)

	if !validateUserPath(srcPath, userRoot) || !validateUserPath(dstPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	if err := copyFileOrDir(srcPath, dstPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Copied successfully"})
}

// renameFile - 파일/폴더 이름 변경
func renameFile(c *gin.Context) {
	username := c.PostForm("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	oldPath := c.PostForm("oldPath")
	newName := c.PostForm("newName")

	if oldPath == "" || newName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Old path and new name required"})
		return
	}

	userRoot, _ := getUserRoot(username)
	oldFullPath := filepath.Join(userRoot, oldPath)
	newFullPath := filepath.Join(filepath.Dir(oldFullPath), newName)

	if !validateUserPath(oldFullPath, userRoot) || !validateUserPath(newFullPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	if err := os.Rename(oldFullPath, newFullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Renamed successfully"})
}

// createDirectory - 디렉토리 생성
func createDirectory(c *gin.Context) {
	username := c.PostForm("user")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username required"})
		return
	}

	path := c.PostForm("path")
	name := c.PostForm("name")

	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Directory name required"})
		return
	}

	if path == "" {
		path = "/"
	}

	userRoot, _ := getUserRoot(username)
	fullPath := filepath.Join(userRoot, path, name)

	if !validateUserPath(fullPath, userRoot) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid path"})
		return
	}

	if err := os.MkdirAll(fullPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Directory created successfully"})
}

// 복사 헬퍼 함수들
func copyFileOrDir(src, dst string) error {
	srcInfo, err := os.Stat(src)
	if err != nil {
		return err
	}

	if srcInfo.IsDir() {
		return copyDir(src, dst)
	}
	return copyFileContent(src, dst)
}

func copyFileContent(src, dst string) error {
	srcFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer srcFile.Close()

	dstFile, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer dstFile.Close()

	_, err = io.Copy(dstFile, srcFile)
	return err
}

func copyDir(src, dst string) error {
	if err := os.MkdirAll(dst, 0755); err != nil {
		return err
	}

	entries, err := os.ReadDir(src)
	if err != nil {
		return err
	}

	for _, entry := range entries {
		srcPath := filepath.Join(src, entry.Name())
		dstPath := filepath.Join(dst, entry.Name())

		if entry.IsDir() {
			if err := copyDir(srcPath, dstPath); err != nil {
				return err
			}
		} else {
			if err := copyFileContent(srcPath, dstPath); err != nil {
				return err
			}
		}
	}
	return nil
}
