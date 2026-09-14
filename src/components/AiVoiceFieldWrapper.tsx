'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, RotateCcw, Loader2 } from 'lucide-react';

interface AiVoiceFieldWrapperProps {
  value: string;
  onChange: (newValue: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
}

export default function AiVoiceFieldWrapper({
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
  rows = 3,
  className = '',
}: AiVoiceFieldWrapperProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [previousDraft, setPreviousDraft] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-GB';

        recognition.onresult = (event: any) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              transcript += event.results[i][0].transcript + ' ';
            }
          }
          if (transcript.trim()) {
            onChange(value ? `${value} ${transcript.trim()}` : transcript.trim());
          }
        };

        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, [onChange, value]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleEnhanceWithAi = async () => {
    if (!value || !value.trim() || isEnhancing) return;
    setPreviousDraft(value);
    setIsEnhancing(true);

    try {
      const res = await fetch('/api/ai/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.enhancedText) {
          onChange(data.enhancedText);
        }
      }
    } catch (e) {
      console.error('Failed to enhance text with AI:', e);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleUndo = () => {
    if (previousDraft !== null) {
      onChange(previousDraft);
      setPreviousDraft(null);
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        {label && <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{label}</label>}
        
        {/* Voice Dictation & AI Controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Recording indicator */}
          {isRecording && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold border border-rose-500/30">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
              Recording...
            </span>
          )}

          {/* Dictation Button */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                isRecording
                  ? 'bg-rose-600 text-white border-rose-500 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700'
              }`}
              title={isRecording ? 'Stop Voice Dictation' : 'Dictate with Voice'}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-blue-500" />}
              <span className="hidden sm:inline text-[11px]">{isRecording ? 'Stop' : 'Dictate'}</span>
            </button>
          )}

          {/* Write Using AI Button */}
          <button
            type="button"
            onClick={handleEnhanceWithAi}
            disabled={!value || !value.trim() || isEnhancing}
            className="p-1.5 rounded-lg border text-xs font-semibold bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30 flex items-center gap-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            title="Polish phrasing into professional regulatory wording using AI"
          >
            {isEnhancing ? <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" /> : <Sparkles className="w-3.5 h-3.5 text-purple-400" />}
            <span className="hidden sm:inline text-[11px]">{isEnhancing ? 'Enhancing...' : 'Write using AI'}</span>
          </button>

          {/* Undo Button */}
          {previousDraft !== null && (
            <button
              type="button"
              onClick={handleUndo}
              className="p-1.5 rounded-lg border text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Undo AI enhancement and restore original draft"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline text-[11px]">Undo</span>
            </button>
          )}
        </div>
      </div>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans shadow-2xs"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 leading-relaxed font-sans shadow-2xs"
        />
      )}
    </div>
  );
}
