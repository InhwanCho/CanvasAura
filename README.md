# CanvasAura

CanvasAura는 실시간 협업을 위한 드로잉 애플리케이션 프로젝트입니다.

이 프로젝트는 Next.js, Prisma, Socket.io, TailwindCSS 및 Shadcn/UI를 사용하여 개발하였습니다.

## 주요 기능

- **실시간 협업**: 여러 사용자가 동시에 캔버스에서 작업할 수 있습니다.
- **다양한 모드**: 드로잉, 선택 등 다양한 모드로 작업할 수 있습니다.
- **색상 선택**: 다양한 색상을 선택하여 드로잉할 수 있습니다.
- **브러시 크기 조정**: 사용자가 원하는 브러시 크기로 조정할 수 있습니다.
- **실행 취소/다시 실행 기능**: 작업을 쉽게 되돌리거나 다시 실행할 수 있습니다.

## 설치 및 실행

1. **저장소 클론**: 아래 명령어를 사용하여 저장소를 클론합니다.

   ```bash
   git clone https://github.com/InhwanCho/CanvasAura.git
   cd CanvasAura
   ```

2. **패키지 설치**: 프로젝트의 의존성을 설치합니다. 다음 명령어를 실행하세요.

   ```bash
   npm install
   ```

3. **환경 변수 설정**: `.env.example` 파일을 복사하여 `.env` 파일을 생성합니다. 이 파일에는 데이터베이스 연결 정보 및 기타 환경 변수가 포함되어 있습니다.

   ```bash
   cp .env.example .env
   ```

   `.env` 파일을 열고 데이터베이스 URL 및 필요한 다른 설정을 입력합니다. 예를 들어:

   ```.env
   DATABASE_URL=
   NEXTAUTH_URL=
   NEXTAUTH_SECRET=
   JWT_SECRET=
   ```

4. **데이터베이스 설정**: Prisma를 사용하여 데이터베이스를 설정합니다. 아래 명령어를 실행하여 데이터베이스 마이그레이션을 수행합니다.

   ```bash
   npx prisma migrate dev --name init
   ```

5. **개발 서버 실행**: 아래 명령어를 사용하여 개발 서버를 실행합니다.

   ```bash
   npm run dev
   ```

   서버가 실행되면 브라우저에서 `http://localhost:3000`으로 이동하여 애플리케이션을 확인할 수 있습니다.

백엔드(websocket) = [백엔드 서버 코드](https://github.com/InhwanCho/CanvasAuraBackend "백엔드 서버 코드") 참조
