# Cloud Storage - K8s File Management System

개인용 클라우드 스토리지 서비스 (Kubernetes 환경)

## 주요 기능

### 파일 관리
- 닉네임 기반 개인 스토리지 공간
- 업로드/다운로드/삭제/이동/복사
- 드래그 앤 드롭 지원
- 썸네일 자동 생성
- 다크모드

### K8s 리소스 모니터
- Node 상태 조회
- Pod 목록 및 상태
- PVC 현황

## 설치

### 1. K8s 환경 배포

```bash
kubectl apply -f k8s-deployment.yaml
```

### 2. 설정 수정

`k8s-deployment.yaml`에서:
- `storageClassName`: 실제 스토리지 클래스로 변경
- `image`: 실제 이미지 레지스트리 경로로 변경

## 사용법

1. 웹 브라우저로 접속
2. 닉네임 입력 (영문/숫자/하이픈만 가능)
3. 파일 업로드/관리

## 파일 구조

```
/storage
  ├── user1/
  │   ├── documents/
  │   └── images/
  ├── user2/
  └── user3/
```

각 사용자는 독립된 폴더를 가지며, 브라우저 localStorage에 닉네임 저장.

## 기술 스택

- Frontend: React
- Backend: Go (Gin)
- Storage: Kubernetes PV/PVC
- Container: Docker
