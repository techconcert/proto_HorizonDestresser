import React, { useState } from 'react';
import { VisualOption } from '../types';
import {
  generateOption1StandaloneHTML,
  generateOption2StandaloneHTML,
  generateOption3StandaloneHTML,
  generateOption4StandaloneHTML,
} from '../utils/standaloneExport';
import { Copy, Check, Download, X, Code2, Infinity as InfinityIcon, Hourglass, Waves, Sprout } from 'lucide-react';

interface CodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeOption: VisualOption;
}

export const CodeExportModal: React.FC<CodeExportModalProps> = ({
  isOpen,
  onClose,
  activeOption,
}) => {
  const [selectedTab, setSelectedTab] = useState<VisualOption>(activeOption);
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentCode =
    selectedTab === 'option1_shader'
      ? generateOption1StandaloneHTML()
      : selectedTab === 'option2_solver'
      ? generateOption2StandaloneHTML()
      : selectedTab === 'option3_depths'
      ? generateOption3StandaloneHTML()
      : generateOption4StandaloneHTML();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownload = () => {
    const filename =
      selectedTab === 'option1_shader'
        ? 'Option1_QuietFlow_Standalone.html'
        : selectedTab === 'option2_solver'
        ? 'Option2_InkInWater_Standalone.html'
        : selectedTab === 'option3_depths'
        ? 'Option3_ClearDepths_Standalone.html'
        : 'Option4_TouchGrass_Standalone.html';
    const blob = new Blob([currentCode], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        id="code-export-modal" 
        className="bg-stone-900 border border-stone-700/80 rounded-2xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-stone-100">Standalone Deliverables & Code Separation</h2>
              <p className="text-xs text-stone-400">Zero-dependency, single-file HTML code ready to copy into production</p>
            </div>
          </div>
          <button
            id="close-export-modal-btn"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-stone-950/40 border-b border-stone-800/80 gap-2">
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <button
              id="export-tab-option1"
              onClick={() => setSelectedTab('option1_shader')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'option1_shader'
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>Option 1: Quiet Flow</span>
            </button>
            <button
              id="export-tab-option2"
              onClick={() => setSelectedTab('option2_solver')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'option2_solver'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
              }`}
            >
              <Hourglass className="w-3.5 h-3.5" />
              <span>Option 2: Sand Ripples</span>
            </button>
            <button
              id="export-tab-option3"
              onClick={() => setSelectedTab('option3_depths')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'option3_depths'
                  ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
              }`}
            >
              <Waves className="w-3.5 h-3.5" />
              <span>Option 3: Clear Depths</span>
            </button>
            <button
              id="export-tab-option4"
              onClick={() => setSelectedTab('option4_grass')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedTab === 'option4_grass'
                  ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40 border border-transparent'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Option 4: Touch Grass</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="copy-code-btn"
              onClick={handleCopy}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition-all active:scale-95"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy Entire HTML'}</span>
            </button>
            <button
              id="download-code-btn"
              onClick={handleDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .html</span>
            </button>
          </div>
        </div>

        {/* Code Preview Viewport */}
        <div className="flex-1 overflow-auto p-4 bg-stone-950 font-mono text-xs text-stone-300 select-text leading-relaxed">
          <pre className="whitespace-pre-wrap select-text">{currentCode}</pre>
        </div>

        {/* Footer Notes */}
        <div className="px-6 py-3 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs text-stone-400">
          <span>
            {selectedTab === 'option1_shader'
              ? 'Self-contained GLSL Impasto Oil vortex shader with domain warping & lighting'
              : selectedTab === 'option2_solver'
              ? 'Self-contained 2D Navier-Stokes Fluid Solver with Jacobi Poisson projection & touch interaction'
              : 'Self-contained dual-pass Lake/Ocean water reveal simulation with river stones, swimming koi & clarity dissipation'}
          </span>
          <span className="text-stone-500">Standalone single HTML file format</span>
        </div>
      </div>
    </div>
  );
};

export default CodeExportModal;

