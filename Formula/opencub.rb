class OpenCub < Formula
  desc "Local-first CLI coding agent with multi-provider support"
  homepage "https://github.com/tylerthomas/opencub"
  url "https://registry.npmjs.org/opencub/-/opencub-1.26.1.tgz"
  sha256 "e1964924a1fe4ef1e9df1aa4983f09e2f2288108adbae3469e20d41e917490d2"
  license "MIT"

  depends_on "node@22"

  def install
    system "npm", "install", *std_npm_args
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    # Test that binary exists and runs
    system "#{bin}/opencub", "--help"
  end
end
