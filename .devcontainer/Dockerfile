# Use the official Microsoft devcontainers base image
ARG VARIANT="22.04"
FROM mcr.microsoft.com/devcontainers/base:ubuntu-${VARIANT}

# Metadata
LABEL maintainer="BitopiaLabs"
LABEL description="Development environment for OpenCub - local-first AI coding assistant"

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive \
	NODE_VERSION=22 \
	PNPM_VERSION=11.0.9 \
	BIOME_VERSION=2.3.10 \
	# OpenCub-specific environment variables
	NODE_ENV=development \
	OPENCUB_LOG_LEVEL=debug \
	OPENCUB_LOG_TO_CONSOLE=true \
	# Locale settings
	LC_ALL=en_US.UTF-8 \
	LANG=en_US.UTF-8

# Install Node.js 22.x using the NodeSource setup script
# This ensures we get the exact Node 22.x LTS version
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
	apt-get install -y nodejs && \
	apt-get clean && rm -rf /var/lib/apt/lists/*

# Install pnpm globally
RUN npm install -g pnpm@${PNPM_VERSION}

# Install Biome CLI globally for convenience. Project scripts use the local
# devDependency installed by pnpm.
RUN npm install -g @biomejs/biome@${BIOME_VERSION}

# Install additional development tools and fonts
RUN apt-get update && \
	apt-get install -y \
	jq \
	curl \
	wget \
	git \
	vim \
	zsh \
	unzip \
	build-essential \
	python3 \
	python3-pip \
	fonts-firacode \
	fonts-powerline && \
	apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Nerd Fonts for Powerline character support
RUN mkdir -p ~/.local/share/fonts && \
	wget -q https://github.com/ryanoasis/nerd-fonts/releases/download/v3.2.1/FiraCode.zip -O /tmp/FiraCode.zip && \
	unzip -q /tmp/FiraCode.zip -d ~/.local/share/fonts && \
	fc-cache -fv

# Install oh-my-zsh for the vscode user and configure the development shell
RUN git clone --depth=1 https://github.com/ohmyzsh/ohmyzsh.git /home/vscode/.oh-my-zsh && \
	cp /home/vscode/.oh-my-zsh/templates/zshrc.zsh-template /home/vscode/.zshrc && \
	echo 'export PNPM_HOME="$HOME/.local/share/pnpm"' >> /home/vscode/.zshrc && \
	echo 'export PATH="$PNPM_HOME:/usr/local/bin:$PATH"' >> /home/vscode/.zshrc && \
	echo 'eval "$(pnpm completions zsh 2>/dev/null)"' >> /home/vscode/.zshrc

# Configure Git for the vscode user
RUN HOME=/home/vscode git config --global --add safe.directory /workspaces/opencub && \
	HOME=/home/vscode git config --global core.autocrlf input && \
	HOME=/home/vscode git config --global core.fileMode false && \
	HOME=/home/vscode git config --global init.defaultBranch main && \
	HOME=/home/vscode git config --global user.email "vscode@localhost" && \
	HOME=/home/vscode git config --global user.name "VS Code Dev Container"

# Set up proper permissions for the vscode user
RUN chown -R vscode:vscode /home/vscode

# Set the working directory
WORKDIR /workspaces/opencub

# Switch to non-root user
USER vscode

# Expose common development ports
EXPOSE 51820

# Default command
CMD ["/bin/bash"]
