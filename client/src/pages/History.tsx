import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function History() {
  const { loading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: audits, isLoading } = trpc.audit.getHistory.useQuery(
    { limit: 50, offset: 0 },
    { enabled: isAuthenticated }
  );

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="animate-spin text-cyan-400" size={48} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-pink-500 text-xl mb-4">Please sign in to view history</p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-cyan-500 text-black font-bold px-8 rounded-none"
          >
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="cyan" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-cyan-400 hover:text-cyan-300"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <h1 className="text-4xl font-black">
            <span className="bg-gradient-to-r from-cyan-400 to-pink-500 bg-clip-text text-transparent">
              AUDIT HISTORY
            </span>
          </h1>
        </div>

        {/* Audits Table */}
        {audits && audits.length > 0 ? (
          <div className="space-y-4">
            {audits.map((audit) => (
              <Card
                key={audit.id}
                className="bg-black border-2 border-cyan-500/50 hover:border-pink-500 rounded-none p-4 transition-colors"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* URL */}
                  <div>
                    <p className="text-cyan-400 text-xs font-mono mb-1">URL</p>
                    <p className="text-white text-sm font-mono truncate">{audit.url}</p>
                  </div>

                  {/* Status */}
                  <div>
                    <p className="text-pink-500 text-xs font-mono mb-1">STATUS</p>
                    <div className="flex items-center gap-2">
                      {audit.error ? (
                        <>
                          <AlertCircle size={16} className="text-red-500" />
                          <span className="text-red-500 font-mono">ERROR</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="text-green-500" />
                          <span className="text-green-500 font-mono">{audit.statusCode}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Response Time */}
                  <div>
                    <p className="text-cyan-400 text-xs font-mono mb-1">TIME</p>
                    <p className="text-white font-mono">{audit.responseTime}ms</p>
                  </div>

                  {/* Date */}
                  <div>
                    <p className="text-pink-500 text-xs font-mono mb-1">DATE</p>
                    <p className="text-white text-sm">
                      {new Date(audit.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-black border-2 border-cyan-500 rounded-none p-8 text-center">
            <p className="text-cyan-400 text-lg">No audits yet. Start by running an audit!</p>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-cyan-500/30 text-center">
          <p className="text-cyan-400 text-sm">
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
        </div>
      </div>
    </div>
  );
}
