/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Trash2, Recycle, Info, ChevronRight, AlertCircle, CheckCircle2, Loader2, Play, Square, Download, Code } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// We'll initialize this inside the function to ensure the API key is fresh

type WasteCategory = 'Plastic' | 'Paper' | 'Metal' | 'Unknown';

interface AnalysisResult {
  category: WasteCategory;
  confidence: number;
  reasoning: string;
  recyclingTips: string[];
}

const CATEGORY_COLORS: Record<WasteCategory, string> = {
  Plastic: 'text-orange-500 bg-orange-50 border-orange-200',
  Paper: 'text-blue-500 bg-blue-50 border-blue-200',
  Metal: 'text-emerald-500 bg-emerald-50 border-emerald-200',
  Unknown: 'text-slate-500 bg-slate-50 border-slate-200',
};

const CATEGORY_ICONS: Record<WasteCategory, React.ReactNode> = {
  Plastic: <Recycle className="w-6 h-6" />,
  Paper: <Trash2 className="w-6 h-6" />,
  Metal: <Trash2 className="w-6 h-6" />,
  Unknown: <Info className="w-6 h-6" />,
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'demo' | 'code' | 'history'>('demo');
  const [history, setHistory] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: username.trim(), 
          password: password.trim() 
        })
      });
      const data = await response.json();
      if (data.success) {
        setIsLoggedIn(true);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to connect to server");
    }
  };

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/history/${username}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setHistory(data);
      } else {
        setHistory([]);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
      setHistory([]);
    }
  }, [username]);

  useEffect(() => {
    if (isLoggedIn && view === 'history') {
      fetchHistory();
    }
  }, [isLoggedIn, view, fetchHistory]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1920")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px]" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 w-full max-w-md p-10 bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/20"
        >
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl text-white mb-4 shadow-lg shadow-emerald-600/20">
              <Recycle className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">EcoSort AI</h1>
            <p className="text-slate-500 font-medium mt-2">Smart Waste Segregation System</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Username</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Password</label>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-slate-900 font-medium"
              />
            </div>
            {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
            <button 
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Sign In <ChevronRight className="w-5 h-5" />
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500 font-medium">
            Don't have an account? <span className="text-emerald-600 cursor-pointer hover:underline">Contact Administrator</span>
          </p>
        </motion.div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-white/50 text-xs font-medium tracking-widest uppercase">
          Powered by Gemini Vision AI
        </div>
      </div>
    );
  }

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setError("Camera access denied. Please enable camera permissions.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsCameraActive(false);
    }
  };

  const analyzeImage = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const model = "gemini-3-flash-preview";
      const prompt = `Analyze this image of waste. Classify it into exactly one of these categories: Plastic, Paper, or Metal. 
      If it's not clearly one of those, use 'Unknown'.
      Provide the result in JSON format:
      {
        "category": "Plastic" | "Paper" | "Metal" | "Unknown",
        "confidence": number (0-1),
        "reasoning": "short explanation",
        "recyclingTips": ["tip 1", "tip 2"]
      }`;

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: base64Image } }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const text = response.text || "{}";
      // Sanitize JSON if it contains markdown markers
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(cleanJson);
      setResult(data);

      // Save to history
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          category: data.category,
          confidence: data.confidence,
          reasoning: data.reasoning
        })
      });
    } catch (err) {
      setError("Failed to analyze image. Please try again.");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <Recycle className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">EcoSort AI</h1>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Smart Waste Segregation System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <nav className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('demo')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'demo' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Live Demo
            </button>
            <button 
              onClick={() => setView('history')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'history' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              History
            </button>
            <button 
              onClick={() => setView('code')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'code' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Project Files
            </button>
          </nav>
          <button 
            onClick={() => {
              stopCamera();
              setIsLoggedIn(false);
            }}
            className="text-slate-400 hover:text-red-500 p-2 transition-colors"
            title="Logout"
          >
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {view === 'history' ? (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold">Classification History</h2>
              <button 
                onClick={fetchHistory}
                className="text-emerald-600 text-sm font-semibold hover:underline"
              >
                Refresh
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Confidence</th>
                    <th className="px-6 py-4">Reasoning</th>
                    <th className="px-6 py-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 font-medium">
                        No history found. Start classifying waste to see results here!
                      </td>
                    </tr>
                  ) : (
                    history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${CATEGORY_COLORS[item.category as WasteCategory] || 'bg-slate-100 text-slate-600'}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm">{(item.confidence * 100).toFixed(1)}%</td>
                        <td className="px-6 py-4 text-sm text-slate-600 max-w-xs truncate">{item.reasoning}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">
                          {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : view === 'demo' ? (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Camera Section */}
            <section className="space-y-4">
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm relative aspect-video flex items-center justify-center bg-slate-900">
                {!isCameraActive ? (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-10 h-10 text-slate-500" />
                    </div>
                    <h3 className="text-white font-semibold mb-2">Camera Inactive</h3>
                    <p className="text-slate-400 text-sm mb-6">Start your camera to begin real-time waste classification.</p>
                    <button 
                      onClick={startCamera}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 mx-auto transition-all active:scale-95"
                    >
                      <Play className="w-5 h-5" /> Start Camera
                    </button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <div className="bg-emerald-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE FEED
                      </div>
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                      <button 
                        onClick={analyzeImage}
                        disabled={isAnalyzing}
                        className="bg-white hover:bg-slate-50 text-slate-900 px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        {isAnalyzing ? 'Analyzing...' : 'Classify Waste'}
                      </button>
                      <button 
                        onClick={stopCamera}
                        className="bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900 text-white p-4 rounded-2xl shadow-xl transition-all active:scale-95"
                      >
                        <Square className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}

              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl">
                <h4 className="text-emerald-800 font-bold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" /> How it works
                </h4>
                <p className="text-emerald-700/80 text-sm leading-relaxed">
                  Our AI system uses a Convolutional Neural Network (CNN) architecture to identify materials. In this web demo, we use the Gemini Vision API to provide high-accuracy classification for Plastic, Paper, and Metal.
                </p>
              </div>
            </section>

            {/* Results Section */}
            <section className="space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm h-full min-h-[400px] flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-bold">Classification Result</h2>
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analysis Engine v2.0</div>
                </div>

                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex-1 flex flex-col"
                    >
                      <div className={`p-6 rounded-3xl border-2 mb-6 flex items-center gap-4 ${CATEGORY_COLORS[result.category]}`}>
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                          {CATEGORY_ICONS[result.category]}
                        </div>
                        <div>
                          <div className="text-xs font-bold uppercase tracking-wider opacity-70">Detected Category</div>
                          <div className="text-2xl font-black">{result.category}</div>
                        </div>
                        <div className="ml-auto text-right">
                          <div className="text-xs font-bold uppercase tracking-wider opacity-70">Confidence</div>
                          <div className="text-xl font-bold">{(result.confidence * 100).toFixed(0)}%</div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Reasoning</h4>
                          <p className="text-slate-700 leading-relaxed">{result.reasoning}</p>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Recycling Guidelines</h4>
                          <div className="grid gap-3">
                            {result.recyclingTips.map((tip, i) => (
                              <div key={i} className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                <span className="text-sm text-slate-700 font-medium">{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={() => setResult(null)}
                        className="mt-auto pt-8 text-emerald-600 font-bold text-sm flex items-center gap-1 hover:gap-2 transition-all"
                      >
                        Scan another item <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="placeholder"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex-1 flex flex-col items-center justify-center text-center p-8"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                        <Trash2 className="w-10 h-10 text-slate-200" />
                      </div>
                      <h3 className="text-slate-400 font-bold mb-2">No Data Captured</h3>
                      <p className="text-slate-400 text-sm max-w-[240px]">Point the camera at an object and click 'Classify Waste' to see results.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </section>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold mb-2">Python Implementation</h2>
                  <p className="text-slate-400 text-sm">Full source code for the local CNN-based waste classifier.</p>
                </div>
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all">
                  <Download className="w-5 h-5" /> Download Project ZIP
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                    <Code className="w-4 h-4" /> train_model.py
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Uses TensorFlow/Keras to build a CNN. Loads images from the dataset directory, performs data augmentation, and trains the model for 10 epochs.
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                    <Code className="w-4 h-4" /> predict_camera.py
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Utilizes OpenCV to access the webcam. Captures frames, resizes them to 224x224, and runs inference using the saved .h5 model.
                  </p>
                </div>
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="font-bold mb-4 flex items-center gap-2 text-emerald-400">
                    <Code className="w-4 h-4" /> preprocess.py
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Contains utility functions for image normalization, resizing, and dataset loading to ensure consistency between training and inference.
                  </p>
                </div>
              </div>

              <div className="mt-8 bg-slate-950 rounded-2xl p-6 font-mono text-xs overflow-x-auto">
                <div className="text-emerald-500 mb-2"># Project Structure</div>
                <div className="text-slate-300">
                  smart-waste-ai/<br/>
                  ├── dataset/<br/>
                  │   ├── plastic/<br/>
                  │   ├── paper/<br/>
                  │   └── metal/<br/>
                  ├── model/<br/>
                  │   └── waste_classifier.h5<br/>
                  ├── src/<br/>
                  │   ├── train_model.py<br/>
                  │   ├── predict_camera.py<br/>
                  │   ├── preprocess.py<br/>
                  │   └── labels.txt<br/>
                  ├── requirements.txt<br/>
                  └── README.md
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-8">
              <h3 className="text-lg font-bold mb-6">Hardware Setup Guide</h3>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 font-bold text-emerald-600">1</div>
                    <div>
                      <h4 className="font-bold mb-1">Microcontroller</h4>
                      <p className="text-sm text-slate-500">Use a Raspberry Pi 4 or Jetson Nano for edge processing capabilities.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 font-bold text-emerald-600">2</div>
                    <div>
                      <h4 className="font-bold mb-1">Camera Module</h4>
                      <p className="text-sm text-slate-500">Connect a USB webcam or PiCamera to capture waste items on the conveyor belt.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 font-bold text-emerald-600">3</div>
                    <div>
                      <h4 className="font-bold mb-1">Servo Motors</h4>
                      <p className="text-sm text-slate-500">Implement mechanical arms to divert waste into specific bins based on AI output.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <h4 className="font-bold mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-500" /> Deployment Tip
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    For real-world deployment, convert the `.h5` model to **TensorFlow Lite** format. This significantly reduces model size and latency, allowing it to run smoothly on low-power hardware like the Raspberry Pi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-6xl mx-auto p-6 text-center text-slate-400 text-sm">
        &copy; 2026 Smart Waste Segregation AI Project. Built for College Final Year Demonstration.
      </footer>
    </div>
  );
}
