import React, { useState } from "react";
import { useWorkflowStore } from "@/stores/workflowStore";
import {
  PROVIDER_MODELS,
  executeAiCompletion,
  type AiProvider,
} from "@/services/aiService";
import {
  X,
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Cpu,
} from "lucide-react";

export const AiSettingsModal: React.FC = () => {
  const {
    isAiSettingsModalOpen,
    setAiSettingsModalOpen,
    aiConfig,
    updateAiConfig,
    pushLog,
  } = useWorkflowStore();

  const [provider, setProvider] = useState<AiProvider>(aiConfig.provider);
  const [apiKey, setApiKey] = useState(aiConfig.apiKey);
  const [model, setModel] = useState(aiConfig.model);
  const [temperature, setTemperature] = useState(aiConfig.temperature);
  const [showKey, setShowKey] = useState(false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  if (!isAiSettingsModalOpen) return null;

  const handleProviderChange = (newProvider: AiProvider) => {
    setProvider(newProvider);
    const defaultMod = PROVIDER_MODELS[newProvider].models[0];
    setModel(defaultMod);
    setTestResult(null);
  };

  const handleSave = () => {
    updateAiConfig({
      provider,
      apiKey: apiKey.trim(),
      model,
      temperature,
    });
    setAiSettingsModalOpen(false);
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      setTestResult({
        success: false,
        message: "Please enter an API key first.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await executeAiCompletion(
        "Ping! Say 'Ready to evaluate curriculum' in under 5 words.",
        "You are an AI curriculum helper.",
        {
          provider,
          apiKey: apiKey.trim(),
          model,
          temperature: 0.2,
        }
      );

      setTestResult({
        success: true,
        message: `Success (${res.latencyMs}ms): "${res.text.trim()}"`,
        latencyMs: res.latencyMs,
      });

      pushLog(
        "success",
        `BYOK connection test verified for ${provider.toUpperCase()} (${model})`
      );
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to connect to AI provider.",
      });
      pushLog("error", `BYOK connection test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl glass-panel rounded-3xl border border-slate-700/80 shadow-2xl flex flex-col bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-glow-purple">
              <KeyRound className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>BYOK AI Engine Settings</span>
                <span className="text-[10px] uppercase font-semibold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full border border-purple-500/40">
                  Bring Your Own Key
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Plug in your own API key to power live IELTS essay grading, SAT problem solving, and ESL speech clinics.
              </p>
            </div>
          </div>

          <button
            onClick={() => setAiSettingsModalOpen(false)}
            className="p-1.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs overflow-y-auto max-h-[70vh]">
          {/* Provider Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              <span>Select AI Provider</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(PROVIDER_MODELS) as AiProvider[]).map((p) => {
                const info = PROVIDER_MODELS[p];
                const isSelected = provider === p;
                return (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-purple-950/40 border-purple-500 text-white shadow-glow-purple"
                        : "bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700"
                    }`}
                  >
                    <span className="font-bold text-xs">{info.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {info.models[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Model Endpoint
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
            >
              {PROVIDER_MODELS[provider].models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>{PROVIDER_MODELS[provider].label} API Key</span>
              {provider === "gemini" && (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-purple-400 hover:text-purple-300 underline font-normal text-[10px]"
                >
                  Get free Gemini key ↗
                </a>
              )}
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder={`Enter your ${PROVIDER_MODELS[provider].label} API key...`}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestResult(null);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Creativity & Temperature
              </label>
              <span className="font-mono text-xs text-purple-400">{temperature}</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.05"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Connection Test Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-2xl text-xs flex items-center gap-2 border ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                  : "bg-rose-950/40 border-rose-500/40 text-rose-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span className="flex-1 font-mono text-[11px] truncate">
                {testResult.message}
              </span>
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">100% Client-Side Privacy:</strong> Your API key is stored strictly in your browser's local storage and used directly from your client. No intermediary server is ever involved.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 flex items-center justify-between gap-3 bg-slate-950">
          <button
            onClick={handleTestConnection}
            disabled={isTesting || !apiKey.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-semibold rounded-xl flex items-center gap-1.5 transition-all text-xs"
          >
            {isTesting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Pinging AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Test Connection</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiSettingsModalOpen(false)}
              className="px-4 py-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium rounded-xl transition-colors text-xs"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-glow-purple transition-all text-xs flex items-center gap-1.5"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
