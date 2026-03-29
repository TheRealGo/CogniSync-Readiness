{
  description = "Python development environment for Neovim";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "aarch64-darwin"; # Apple Silicon Mac
      # system = "x86_64-darwin"; # Intel Mac
      # system = "x86_64-linux"; # Linux
      pkgs = nixpkgs.legacyPackages.${system};
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        buildInputs = with pkgs; [
          python312
          uv
          pyright
          ruff
          isort
          black
        ];

        shellHook = ''
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          echo "🐍 Python 3.12 (uv) Environment Loaded!"
          echo "✅ Ready for Neovim (pyright, ruff, isort, black)"
          echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
          python --version
          uv --version
        '';
      };
    };
}
