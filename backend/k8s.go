package main

import (
	"context"
	"net/http"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

var k8sClient *kubernetes.Clientset

func initK8sClient() error {
	var config *rest.Config
	var err error

	// In-cluster config 시도
	config, err = rest.InClusterConfig()
	if err != nil {
		// kubeconfig 파일 사용
		kubeconfig := filepath.Join(os.Getenv("HOME"), ".kube", "config")
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return err
		}
	}

	k8sClient, err = kubernetes.NewForConfig(config)
	return err
}

type NodeInfo struct {
	Name   string `json:"name"`
	Ready  bool   `json:"ready"`
	CPU    string `json:"cpu"`
	Memory string `json:"memory"`
	Pods   string `json:"pods"`
}

type PodInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Status    string `json:"status"`
	Restarts  int32  `json:"restarts"`
	Age       string `json:"age"`
}

type PVCInfo struct {
	Name         string `json:"name"`
	Namespace    string `json:"namespace"`
	Status       string `json:"status"`
	Capacity     string `json:"capacity"`
	StorageClass string `json:"storageClass"`
}

func getK8sResources(c *gin.Context) {
	if k8sClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "K8s client not initialized"})
		return
	}

	ctx := context.Background()

	// Nodes
	nodes, err := k8sClient.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	var nodeInfos []NodeInfo
	if err == nil {
		for _, node := range nodes.Items {
			ready := false
			for _, cond := range node.Status.Conditions {
				if cond.Type == "Ready" && cond.Status == "True" {
					ready = true
					break
				}
			}

			nodeInfos = append(nodeInfos, NodeInfo{
				Name:   node.Name,
				Ready:  ready,
				CPU:    node.Status.Capacity.Cpu().String(),
				Memory: node.Status.Capacity.Memory().String(),
				Pods:   node.Status.Capacity.Pods().String(),
			})
		}
	}

	// Pods
	pods, err := k8sClient.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	var podInfos []PodInfo
	if err == nil {
		for _, pod := range pods.Items {
			restarts := int32(0)
			if len(pod.Status.ContainerStatuses) > 0 {
				restarts = pod.Status.ContainerStatuses[0].RestartCount
			}

			podInfos = append(podInfos, PodInfo{
				Name:      pod.Name,
				Namespace: pod.Namespace,
				Status:    string(pod.Status.Phase),
				Restarts:  restarts,
				Age:       pod.CreationTimestamp.String(),
			})
		}
	}

	// PVCs
	pvcs, err := k8sClient.CoreV1().PersistentVolumeClaims("").List(ctx, metav1.ListOptions{})
	var pvcInfos []PVCInfo
	if err == nil {
		for _, pvc := range pvcs.Items {
			storageClass := ""
			if pvc.Spec.StorageClassName != nil {
				storageClass = *pvc.Spec.StorageClassName
			}

			capacity := ""
			if pvc.Status.Capacity != nil {
				capacity = pvc.Status.Capacity.Storage().String()
			}

			pvcInfos = append(pvcInfos, PVCInfo{
				Name:         pvc.Name,
				Namespace:    pvc.Namespace,
				Status:       string(pvc.Status.Phase),
				Capacity:     capacity,
				StorageClass: storageClass,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"nodes": nodeInfos,
		"pods":  podInfos,
		"pvcs":  pvcInfos,
	})
}
