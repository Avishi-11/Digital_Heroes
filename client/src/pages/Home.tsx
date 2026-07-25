import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Zap, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { startLogin } from "@/const";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [url, setUrl] = useState("");
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const auditMutation = trpc.audit.performAudit.useMutation({
    onSuccess: (result) => {
      setAuditResult(result);
      setIsAuditing(false);
      toast.success("Audit completed successfully");
    },
    onError: (error) => {
      setIsAuditing(false);
      toast.error(error.message || "Audit failed");
    },
  });

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }
    setIsAuditing(true);
    auditMutation.mutate({ url: url.trim() });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-transparent to-pink-500" />
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 bg-pink-500 animate-pulse" />
            <h1 className="text-5xl font-black tracking-tighter">
              <span className="bg-gradient-to-r from-cyan-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent">
                PAGE PULSE
              </span>
            </h1>
            <div className="w-2 h-2 bg-cyan-400 animate-pulse" />
          </div>
          <p className="text-cyan-300 text-lg font-light tracking-wide">
            Production-Grade URL Audit Service
          </p>
        </div>

        {/* Audit Form Card */}
        <Card className="bg-black border-2 border-cyan-500 rounded-none mb-8 shadow-2xl shadow-cyan-500/50">
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <Zap size={24} className="text-pink-500" />
              <h2 className="text-2xl font-bold text-pink-500">AUDIT URL</h2>
            </div>

            <form onSubmit={handleAudit} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-pink-500" />
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isAuditing}
                  className="pl-6 bg-black border-2 border-cyan-400 text-white placeholder-cyan-600 focus:border-pink-500 focus:ring-pink-500 rounded-none"
                />
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isAuditing}
                  className="bg-gradient-to-r from-cyan-500 to-pink-500 text-black font-bold px-8 rounded-none hover:shadow-lg hover:shadow-pink-500/50 disabled:opacity-50"
                >
                  {isAuditing ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      AUDITING...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2" size={16} />
                      RUN AUDIT
                    </>
                  )}
                </Button>

                {isAuthenticated && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-cyan-400 text-cyan-400 rounded-none hover:bg-cyan-400/10"
                    onClick={() => {
                      // Navigate to history
                      window.location.href = "/history";
                    }}
                  >
                    VIEW HISTORY
                  </Button>
                )}

                {!isAuthenticated && (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-2 border-pink-500 text-pink-500 rounded-none hover:bg-pink-500/10"
                    onClick={() => {
                      startLogin();
                    }}
                  >
                    SIGN IN
                  </Button>
                )}
              </div>
            </form>
          </div>
        </Card>

        {/* Audit Results */}
        {auditResult && (
          <Card className="bg-black border-2 border-pink-500 rounded-none shadow-2xl shadow-pink-500/50">
            <div className="p-8">
              <div className="flex items-center gap-2 mb-6">
                {auditResult.error ? (
                  <>
                    <AlertCircle size={24} className="text-red-500" />
                    <h2 className="text-2xl font-bold text-red-500">AUDIT FAILED</h2>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={24} className="text-green-500" />
                    <h2 className="text-2xl font-bold text-green-500">AUDIT COMPLETE</h2>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* URL */}
                <div className="border-l-2 border-cyan-400 pl-4">
                  <p className="text-cyan-400 text-sm font-mono">URL</p>
                  <p className="text-white font-mono text-sm break-all">{auditResult.url}</p>
                </div>

                {/* Status Code */}
                {auditResult.statusCode && (
                  <div className="border-l-2 border-pink-500 pl-4">
                    <p className="text-pink-500 text-sm font-mono">STATUS CODE</p>
                    <p className="text-white font-mono text-lg font-bold">{auditResult.statusCode}</p>
                  </div>
                )}

                {/* Response Time */}
                <div className="border-l-2 border-cyan-400 pl-4">
                  <p className="text-cyan-400 text-sm font-mono">RESPONSE TIME</p>
                  <p className="text-white font-mono text-lg font-bold">{auditResult.responseTime}ms</p>
                </div>

                {/* Content Type */}
                {auditResult.contentType && (
                  <div className="border-l-2 border-pink-500 pl-4">
                    <p className="text-pink-500 text-sm font-mono">CONTENT TYPE</p>
                    <p className="text-white font-mono text-sm">{auditResult.contentType}</p>
                  </div>
                )}

                {/* Title */}
                {auditResult.title && (
                  <div className="border-l-2 border-cyan-400 pl-4 md:col-span-2">
                    <p className="text-cyan-400 text-sm font-mono">PAGE TITLE</p>
                    <p className="text-white text-sm">{auditResult.title}</p>
                  </div>
                )}

                {/* Meta Description */}
                {auditResult.metaDescription && (
                  <div className="border-l-2 border-pink-500 pl-4 md:col-span-2">
                    <p className="text-pink-500 text-sm font-mono">META DESCRIPTION</p>
                    <p className="text-white text-sm">{auditResult.metaDescription}</p>
                  </div>
                )}

                {/* Error */}
                {auditResult.error && (
                  <div className="border-l-2 border-red-500 pl-4 md:col-span-2">
                    <p className="text-red-500 text-sm font-mono">ERROR</p>
                    <p className="text-white text-sm">{auditResult.error}</p>
                  </div>
                )}

                {/* Request ID */}
                <div className="border-l-2 border-cyan-400 pl-4 md:col-span-2">
                  <p className="text-cyan-400 text-sm font-mono">REQUEST ID</p>
                  <p className="text-white font-mono text-xs">{auditResult.requestId}</p>
                </div>
              </div>

              {/* Cached indicator */}
              {auditResult.cachedAt && (
                <div className="mt-6 flex items-center gap-2 text-cyan-400 text-sm">
                  <Clock size={16} />
                  <span>Served from cache</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-cyan-500/30 text-center">
          <p className="text-cyan-400 text-sm mb-2">
            Built for{" "}
            <a
              href="https://digitalheroesco.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-400 font-bold underline"
            >
              Digital Heroes Training Task
            </a>
          </p>
          <p className="text-cyan-600 text-xs">
            Production-grade URL auditing with caching, rate limiting, and structured logging
          </p>
        </div>
      </div>
    </div>
  );
}
