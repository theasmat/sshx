#!/usr/bin/env bash
# ==============================================================================
# SSHX Universal Installer for macOS & Linux
# https://github.com/theasmat/sshx
# ==============================================================================
set -e

REPO="theasmat/sshx"
APP_NAME="SSHX"
GITHUB_API="https://api.github.com/repos/${REPO}/releases/latest"

# Color formatting
BOLD="$(printf '\033[1m')"
GREEN="$(printf '\033[0;32m')"
CYAN="$(printf '\033[0;36m')"
YELLOW="$(printf '\033[0;33m')"
RED="$(printf '\033[0;31m')"
RESET="$(printf '\033[0m')"

info() {
    printf "${CYAN}[SSHX]${RESET} %b\n" "$*"
}

success() {
    printf "${GREEN}${BOLD}[SSHX] ✓ %b${RESET}\n" "$*"
}

warn() {
    printf "${YELLOW}[SSHX] ! %b${RESET}\n" "$*"
}

error() {
    printf "${RED}${BOLD}[SSHX] ✗ %b${RESET}\n" "$*" >&2
}

# Banner
cat << "EOF"
  ____ ____  _   ___  __
 / ___/ ___|| | | \ \/ /
 \___ \___ \| |_| |\  / 
  ___) |__) |  _  |/  \ 
 |____/____/|_| |_/_/\_\
 Modern SSH Desktop Manager
====================================
EOF

# Detect OS and Architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$ARCH" in
    x86_64|amd64)
        ARCH_NORM="x64"
        ARCH_ALT="x86_64"
        ;;
    arm64|aarch64)
        ARCH_NORM="aarch64"
        ARCH_ALT="arm64"
        ;;
    *)
        error "Unsupported system architecture: $ARCH"
        exit 1
        ;;
esac

info "Detected System: ${BOLD}${OS} (${ARCH})${RESET}"

# Create secure temporary work directory
TMP_DIR="$(mktemp -d -t sshx-install-XXXXXX)"
cleanup() {
    if [ -d "$TMP_DIR" ]; then
        rm -rf "$TMP_DIR"
    fi
}
trap cleanup EXIT INT TERM

# Fetch latest release metadata from GitHub
info "Checking for latest release from GitHub..."
RELEASE_JSON="$TMP_DIR/release.json"

if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -sL -w "%{http_code}" -o "$RELEASE_JSON" "$GITHUB_API")
elif command -v wget >/dev/null 2>&1; then
    wget -qO "$RELEASE_JSON" "$GITHUB_API"
    HTTP_CODE="200"
else
    error "Neither curl nor wget is available. Please install one to proceed."
    exit 1
fi

if [ ! -s "$RELEASE_JSON" ] || [ "$HTTP_CODE" != "200" ] || grep -q '"message": *"Not Found"' "$RELEASE_JSON"; then
    warn "No published releases found yet on GitHub repository '${REPO}'."
    info "To publish a release, tag a commit with 'v0.1.0' or trigger the 'Release & Build Packages' action in GitHub Actions."
    info "You can also build SSHX locally from source with:"
    printf "  ${BOLD}git clone https://github.com/%s.git && cd sshx && npm install && npm run tauri build${RESET}\n\n" "$REPO"
    exit 0
fi

# Extract Tag Name
TAG_NAME=$(grep -o '"tag_name": *"[^"]*"' "$RELEASE_JSON" | head -n 1 | cut -d '"' -f 4)
if [ -z "$TAG_NAME" ]; then
    warn "No release tags found in GitHub response."
    info "Please visit https://github.com/${REPO}/releases"
    exit 0
fi
info "Target Release: ${BOLD}${TAG_NAME}${RESET}"

# macOS Installation Flow
if [ "$OS" = "darwin" ]; then
    info "Preparing macOS installation..."

    # Look for matching DMG
    DMG_URL=$(grep -o '"browser_download_url": *"[^"]*\.dmg"' "$RELEASE_JSON" | cut -d '"' -f 4 | grep -i "${ARCH_NORM}" | head -n 1 || true)
    if [ -z "$DMG_URL" ]; then
        DMG_URL=$(grep -o '"browser_download_url": *"[^"]*\.dmg"' "$RELEASE_JSON" | cut -d '"' -f 4 | grep -i "universal" | head -n 1 || true)
    fi
    if [ -z "$DMG_URL" ]; then
        DMG_URL=$(grep -o '"browser_download_url": *"[^"]*\.dmg"' "$RELEASE_JSON" | cut -d '"' -f 4 | head -n 1 || true)
    fi

    if [ -z "$DMG_URL" ]; then
        error "No .dmg asset found for release $TAG_NAME"
        exit 1
    fi

    DMG_FILE="$TMP_DIR/SSHX.dmg"
    info "Downloading ${DMG_URL}..."
    curl -fSL --progress-bar "$DMG_URL" -o "$DMG_FILE"

    MOUNT_DIR="$TMP_DIR/mount"
    mkdir -p "$MOUNT_DIR"

    info "Mounting disk image..."
    hdiutil attach -nobrowse -quiet "$DMG_FILE" -mountpoint "$MOUNT_DIR"

    TARGET_APP_DIR="/Applications"
    if [ ! -w "$TARGET_APP_DIR" ]; then
        TARGET_APP_DIR="$HOME/Applications"
        mkdir -p "$TARGET_APP_DIR"
    fi

    APP_DEST="$TARGET_APP_DIR/${APP_NAME}.app"
    info "Installing to ${APP_DEST}..."
    if [ -d "$APP_DEST" ]; then
        rm -rf "$APP_DEST"
    fi

    cp -R "$MOUNT_DIR/${APP_NAME}.app" "$APP_DEST"

    info "Unmounting disk image..."
    hdiutil detach "$MOUNT_DIR" -force -quiet || true

    info "Configuring macOS Gatekeeper & permissions..."
    # Strip quarantine attribute to allow unsigned/ad-hoc binary to launch smoothly
    xattr -rd com.apple.quarantine "$APP_DEST" 2>/dev/null || xattr -cr "$APP_DEST" 2>/dev/null || true
    
    # Re-apply ad-hoc codesign signature locally
    if command -v codesign >/dev/null 2>&1; then
        codesign --force --deep --sign - "$APP_DEST" 2>/dev/null || true
    fi

    success "SSHX successfully installed to ${APP_DEST}!"
    printf "\n"
    info "You can launch SSHX anytime via Spotlight (Cmd + Space -> SSHX) or run:"
    printf "  ${BOLD}open -a \"%s\"${RESET}\n\n" "$APP_DEST"

# Linux Installation Flow
elif [ "$OS" = "linux" ]; then
    info "Preparing Linux installation..."

    # Check for .deb or .AppImage
    DEB_URL=$(grep -o '"browser_download_url": *"[^"]*\.deb"' "$RELEASE_JSON" | cut -d '"' -f 4 | grep -i "${ARCH_ALT}\|amd64\|${ARCH_NORM}" | head -n 1 || true)
    APPIMAGE_URL=$(grep -o '"browser_download_url": *"[^"]*\.AppImage"' "$RELEASE_JSON" | cut -d '"' -f 4 | grep -i "${ARCH_ALT}\|${ARCH_NORM}" | head -n 1 || true)

    if [ -n "$DEB_URL" ] && command -v dpkg >/dev/null 2>&1; then
        DEB_FILE="$TMP_DIR/sshx.deb"
        info "Downloading Debian package..."
        curl -fSL --progress-bar "$DEB_URL" -o "$DEB_FILE"

        info "Installing with dpkg (may require sudo)..."
        if [ "$EUID" -eq 0 ]; then
            dpkg -i "$DEB_FILE" || apt-get install -f -y
        else
            sudo dpkg -i "$DEB_FILE" || sudo apt-get install -f -y
        fi
        success "SSHX .deb package installed successfully!"

    elif [ -n "$APPIMAGE_URL" ]; then
        BIN_DIR="$HOME/.local/bin"
        mkdir -p "$BIN_DIR"
        APPIMAGE_DEST="$BIN_DIR/sshx"

        info "Downloading AppImage..."
        curl -fSL --progress-bar "$APPIMAGE_URL" -o "$APPIMAGE_DEST"
        chmod +x "$APPIMAGE_DEST"

        # Setup desktop shortcut if directory exists
        DESKTOP_DIR="$HOME/.local/share/applications"
        if [ -d "$DESKTOP_DIR" ] || mkdir -p "$DESKTOP_DIR"; then
            cat << DESKTOP_EOF > "$DESKTOP_DIR/sshx.desktop"
[Desktop Entry]
Name=SSHX
Comment=Modern SSH Desktop Manager
Exec=$APPIMAGE_DEST %U
Terminal=false
Type=Application
Categories=Utility;Development;Network;
DESKTOP_EOF
        fi

        success "SSHX AppImage installed to ${APPIMAGE_DEST}!"
        info "Make sure ~/.local/bin is in your PATH."
    else
        error "No compatible Linux installer (.deb or .AppImage) found for architecture $ARCH."
        info "Please visit: https://github.com/${REPO}/releases/latest"
        exit 1
    fi

else
    error "Operating system '$OS' is not supported by this shell installer."
    info "Please visit: https://github.com/${REPO}/releases/latest for manual downloads."
    exit 1
fi

info "Temporary installation files wiped clean."
success "Installation complete. Enjoy SSHX!"
