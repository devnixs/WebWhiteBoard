# Stage 1: build the frontend
FROM node:22-alpine AS node-build
WORKDIR /build/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: publish the backend
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS dotnet-build
WORKDIR /src
COPY WebWhiteBoard.slnx ./
COPY backend/WebWhiteBoard.Api/WebWhiteBoard.Api.csproj backend/WebWhiteBoard.Api/
COPY backend/WebWhiteBoard.Application/WebWhiteBoard.Application.csproj backend/WebWhiteBoard.Application/
COPY backend/WebWhiteBoard.Domain/WebWhiteBoard.Domain.csproj backend/WebWhiteBoard.Domain/
COPY backend/WebWhiteBoard.Infrastructure/WebWhiteBoard.Infrastructure.csproj backend/WebWhiteBoard.Infrastructure/
RUN dotnet restore backend/WebWhiteBoard.Api/WebWhiteBoard.Api.csproj
COPY backend/ backend/
RUN dotnet publish backend/WebWhiteBoard.Api/WebWhiteBoard.Api.csproj \
    -c Release -o /app/publish --no-restore

# Stage 3: runtime image
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=dotnet-build /app/publish ./
COPY --from=node-build /build/frontend/dist ./wwwroot/
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebWhiteBoard.Api.dll"]
