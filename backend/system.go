package main

import (
	"net/http"
	"os"
	"runtime"

	"github.com/gin-gonic/gin"
	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/mem"
)

type SystemStats struct {
	CPU    CPUStats    `json:"cpu"`
	Memory MemoryStats `json:"memory"`
	Disk   DiskStats   `json:"disk"`
}

type CPUStats struct {
	UsagePercent float64 `json:"usagePercent"`
	Cores        int     `json:"cores"`
}

type MemoryStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

type DiskStats struct {
	Total       uint64  `json:"total"`
	Used        uint64  `json:"used"`
	Free        uint64  `json:"free"`
	UsedPercent float64 `json:"usedPercent"`
}

// getSystemStats - 시스템 리소스 정보 조회
func getSystemStats(c *gin.Context) {
	stats := SystemStats{}

	// CPU 정보
	cpuPercent, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercent) > 0 {
		stats.CPU.UsagePercent = cpuPercent[0]
	}
	stats.CPU.Cores = runtime.NumCPU()

	// 메모리 정보
	memInfo, err := mem.VirtualMemory()
	if err == nil {
		stats.Memory.Total = memInfo.Total
		stats.Memory.Used = memInfo.Used
		stats.Memory.Free = memInfo.Free
		stats.Memory.UsedPercent = memInfo.UsedPercent
	}

	// 디스크 정보
	nasRoot := os.Getenv("NAS_ROOT")
	if nasRoot == "" {
		nasRoot = "/"
	}
	diskInfo, err := disk.Usage(nasRoot)
	if err == nil {
		stats.Disk.Total = diskInfo.Total
		stats.Disk.Used = diskInfo.Used
		stats.Disk.Free = diskInfo.Free
		stats.Disk.UsedPercent = diskInfo.UsedPercent
	}

	c.JSON(http.StatusOK, stats)
}
