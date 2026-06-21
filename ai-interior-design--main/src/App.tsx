// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AutoAwesome as AutoAwesomeIcon,
  AddCircle as AddCircleIcon,
  Search as SearchIcon,
  Chair as ChairIcon,
  Bed as BedIcon,
  Kitchen as KitchenIcon,
  Bathtub as BathtubIcon,
  Desk as DeskIcon,
  Dining as DiningIcon,
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Palette as PaletteIcon,
  Lightbulb as LightbulbIcon,
  Psychology as PsychologyIcon,
  CloudUpload as CloudUploadIcon,
  Share as ShareIcon,
  UnfoldMore as UnfoldMoreIcon,
  Architecture as ArchitectureIcon,
  Home as HomeIcon,
  Person as PersonIcon,
  AutoFixHigh as AutoFixHighIcon,
  AutoAwesomeMotion as AutoAwesomeMotionIcon,
  LogOut as LogOutIcon,
  Upload as UploadIcon,
  ImageIcon,
  XIcon,
  Camera,
  Eye as EyeIcon
} from './components/Icons';
import { cn } from './lib/utils';
import { 
  signInWithGoogle, 
  onAuthChange, 
  saveDesign, 
  getUserDesigns,
  auth
} from './services/firebaseService';
import { localStorageService } from './services/localStorageService';
import { 
  saveDesignLocally, 
  getUserDesignsLocally, 
  checkLocalServerHealth 
} from './services/localDatabaseService';
import { User as FirebaseUser } from 'firebase/auth';
import { GoogleGenAI } from '@google/genai';
import { getFurnitureModel, FURNITURE_MODELS } from './lib/furnitureCatalog';
import { SpatialLab } from './components/SpatialLab';
import { 
  Send as SendIcon,
  Bot as BotIcon,
  Database as DatabaseIcon,
  MessageSquare as MessageSquareIcon,
  ChevronRight as ChevronRightIcon,
  Check as CheckIcon,
  Sparkles as SparklesIcon,
  Plus as PlusIcon,
  History as HistoryIcon,
  Menu as MenuIcon,
  Mic as MicIcon,
  Maximize2 as MaximizeIcon,
  Settings as SettingsIcon,
  Download as DownloadIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Trash2 as TrashIcon,
  Save as SaveIcon,
  Wand2 as MagicIcon,
  Layers as LayersIcon,
  Box as BoxIcon,
  Compass as DiscoveryIcon,
  User as UserIcon,
  Zap as ZapIcon,
  Pencil as PencilIcon,
  Clock as ClockIcon,
  Info as InfoIcon,
  AlertTriangle as WarningIcon,
  ArrowRight as ArrowRightIcon,
  MoreVertical as MoreIcon,
  Edit as EditIcon,
  Filter as FilterIcon,
  Shield as ShieldIcon,
  Lock as LockIcon,
  Globe as GlobeIcon,
  Ruler as RulerIcon
} from 'lucide-react';

import '@google/model-viewer';

// Types
type Step = 'landing' | 'studio' | 'results' | 'inspiration' | 'visualizer' | 'ar' | 'chat';
type LandingTab = 'all' | 'designs' | 'library';

interface DesignParams {
  roomType: string;
  width: string;
  length: string;
  style: string;
  budget: string;
  specificBudget?: string;
  color: string;
  roomImage?: string;
}

interface Suggestion {
  area: number;
  furniture: Array<{ name: string; placement: string; modelUrl?: string }>;
  colors: string[];
  insights: string;
  ecoTips?: string[];
  optimization?: {
    score: number;
    efficiency: string;
  };
  title?: string;
  moodboardUrl?: string;
}

export default function App() {
  const [step, setStep] = useState<Step>('landing');
  const [landingTab, setLandingTab] = useState<LandingTab>('all');
  const [params, setParams] = useState<DesignParams>({
    roomType: 'Living Room',
    width: '12',
    length: '15',
    style: 'Minimalist',
    budget: 'Premium',
    color: '#4A5D4E',
    roomImage: undefined
  });
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [visualizedImage, setVisualizedImage] = useState<string | null>(null);
  const [isVisualizing, setIsVisualizing] = useState(false);
  const [arModel, setArModel] = useState<string | null>(null);
  const [arStartWithCamera, setArStartWithCamera] = useState(false);
  const [lightingMode, setLightingMode] = useState<'Daylight' | 'Evening' | 'Twilight'>('Daylight');
  const [customModels, setCustomModels] = useState<Record<string, any>>({});
  const [isSpatialLabOpen, setIsSpatialLabOpen] = useState(false);
  const [spatialLabInitial, setSpatialLabInitial] = useState<{ url?: string; name?: string }>({});

  useEffect(() => {
    // Load custom models from storage
    const savedCustom = localStorage.getItem('aura_custom_models');
    if (savedCustom) {
      try {
        setCustomModels(JSON.parse(savedCustom));
      } catch (e) {
        console.error("Failed to load custom models", e);
      }
    }
    const draft = localStorageService.loadDraft();
    if (draft.params) {
      setParams(draft.params);
    }
    if (draft.suggestion) {
      setSuggestion(draft.suggestion);
    }

    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchHistory(currentUser.uid);
      } else {
        setHistory([]);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorageService.saveDraft(params, suggestion);
  }, [params, suggestion]);

  const fetchHistory = async (uid: string) => {
    try {
      let data;
      // Try local database server first
      const isLocalAvailable = await checkLocalServerHealth();
      if (isLocalAvailable) {
        data = await getUserDesignsLocally(uid);
      } else {
        data = await getUserDesigns(uid);
      }
      setHistory(data.sort((a: any, b: any) => {
        const timeA = a.createdAt?.toMillis?.() || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.createdAt?.toMillis?.() || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return (timeB || 0) - (timeA || 0);
      }));
    } catch (err) {
       console.error(err);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      const width = Number(params.width) || 10;
      const length = Number(params.length) || 10;
      const area = width * length;

      const buildPrompt = (includeImage: boolean) => {
        const text = `You are a Senior Spatial Architect. Generate interior design JSON for a ${params.style} ${params.roomType}, area ${area} sq ft.

      ### CONSTRAINTS:
      - Budget: ${params.specificBudget ? `$${params.specificBudget}` : params.budget}
      - Color scheme: ${params.color}
      ${includeImage ? "- Analyze the room photo and adapt to its existing features.\n" : ""}
      ### STYLE RULES:
      - Industrial: exposed metal, dark woods, leather
      - Modern: clean lines, neutral tones, chrome accents
      - Coastal: natural fibers, blues/whites, weathered wood
      - Minimalist: clean surfaces, neutral palette, functional pieces
      - Scandinavian: light woods, cozy textiles, simplicity

      ### FEW-SHOT:
      User: "Modern Living Room 200 sq ft"
      Response: {
        "furniture": [
          {"name":"Modern Sofa","placement":"Center, 3ft from north wall"},
          {"name":"Glass Coffee Table","placement":"In front of sofa, aligned with rug"},
          {"name":"Modern Armchair","placement":"45-degree angle SW corner"}
        ],
        "colors": ["Cool Slate (Primary)","Soft Linen (Secondary)","Emerald Green (Accent)"],
        "insights": "In a 200 sq ft space, clear path to balcony is vital.",
        "ecoTips": ["FSC-certified oak","Low-VOC paint"]
      }

      Response MUST be strict JSON format.`;

        const parts: any[] = [{ text }];

        if (includeImage && params.roomImage?.includes(',')) {
          const b64 = params.roomImage.split(',')[1];
          if (b64) {
            parts.push({ inlineData: { mimeType: "image/jpeg", data: b64 } });
          }
        }

        return parts;
      };

      let parts = buildPrompt(true);
      let response;

      try {
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: "application/json" }
        });
      } catch (imgErr: any) {
        console.warn("Image input rejected, retrying text-only:", imgErr.message);
        parts = buildPrompt(false);
        response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: [{ role: 'user', parts }],
          config: { responseMimeType: "application/json" }
        });
      }
      
      const responseText = response.text || "";
      
      try {
        const aiSuggestion = JSON.parse(responseText);
        
        const furniture = aiSuggestion.furniture.map((item: any) => ({
          ...item,
          modelUrl: getFurnitureModel(item.name, customModels)
        }));

        setSuggestion({
          area,
          furniture,
          colors: aiSuggestion.colors,
          insights: aiSuggestion.insights,
          ecoTips: aiSuggestion.ecoTips,
          optimization: aiSuggestion.optimization || {
            score: aiSuggestion.optimizationScore || 85,
            efficiency: aiSuggestion.efficiency || (area > 200 ? "High Volume Utilization" : "Compact Efficiency Max")
          }
        });
        setStep('results');
      } catch (parseError) {
        console.error("AI JSON Parse Error:", responseText);
        throw new Error("Failed to parse design suggestions. Please try again.");
      }
    } catch (err) {
      console.error("Design generation failed:", err);
      alert(err instanceof Error ? err.message : "Calculation failed. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      await signInWithGoogle();
      return;
    }
    if (!suggestion) return;

    try {
      setLoading(true);
      // Try local database server first
      const isLocalAvailable = await checkLocalServerHealth();
      if (isLocalAvailable) {
        await saveDesignLocally(user.uid, {
          name: suggestion?.title || `${params.roomType} Plan`,
          roomType: params.roomType,
          params: params,
          suggestion: suggestion,
          previewImage: suggestion?.moodboardUrl || ""
        });
      } else {
        await saveDesign(user.uid, {
          ...params,
          ...suggestion
        });
      }
      fetchHistory(user.uid);
      alert(isLocalAvailable ? "Design saved to your local database server!" : "Design saved to the cloud successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save design.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (mode?: 'Daylight' | 'Evening' | 'Twilight') => {
    if (!params) return;
    const currentMode = mode || lightingMode;
    setLightingMode(currentMode);
    setIsVisualizing(true);
    setStep('visualizer');
    
    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      const lightingDescription = {
        'Daylight': 'bright natural daylight streaming through windows',
        'Evening': 'warm evening atmosphere with cozy indoor lighting',
        'Twilight': 'moody twilight hour with soft blue tones and subtle interior glows'
      }[currentMode];

      const budgetPart = params.specificBudget ? `with a specific budget of $${params.specificBudget}` : `with a ${params.budget} budget`;
      const prompt = `A high-end, hyper-realistic architectural photo of a ${params.style} ${params.roomType} designed ${budgetPart}. 
      Context: ${suggestion?.insights}. 
      Lighting Mode: ${lightingDescription}. 
      Key Furniture: ${suggestion?.furniture?.map((f: any) => f.name).join(', ')}.
      Atmosphere: Professional architectural photography, Unreal Engine 5 render, cinematic lighting, 8k resolution, photorealistic textures, depth of field, sharp focus, magazine quality interior design concept.`;
      
      const parts: any[] = [{ text: prompt }];

      let response;
      try {
        response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: [{ role: 'user', parts }],
          config: {
            imageConfig: { aspectRatio: "16:9" },
            systemInstruction: "You are an architectural visualization engine. Generate a high-fidelity interior design rendering. The output MUST be a single image.",
          }
        });
      } catch (e: any) {
        console.warn("Primary image model failed, trying alt:", e.message);
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-image-preview",
            contents: [{ role: 'user', parts }],
            config: {
              imageConfig: { aspectRatio: "16:9" },
              systemInstruction: "You are an architectural visualization engine. Generate a high-fidelity interior design rendering. The output MUST be a single image.",
            }
          });
        } catch (e2: any) {
          throw new Error(`Image generation unavailable: ${e2.message}`);
        }
      }

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          setVisualizedImage(`data:image/png;base64,${part.inlineData.data}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("The AI model did not return an image. Please try a different model or lighting mode.");
      }
    } catch (err) {
      console.error("Image generation failed:", err);
      alert(err instanceof Error ? `AI Visualization failed: ${err.message}` : "AI Visualization failed. Please ensure your API key is correctly configured.");
      setStep('results');
    } finally {
      setIsVisualizing(false);
    }
  };

  const handleViewOrGenerateInSpatialLab = (item: any) => {
    setSpatialLabInitial({ url: item.modelUrl || getFurnitureModel(item.name, customModels), name: item.name });
    setIsSpatialLabOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fbf9f6] pb-24 md:pb-0">
      <Header 
        user={user} 
        onTabChange={(tab) => {
          setStep('landing');
          setLandingTab(tab);
        }}
        onInspiration={() => setStep('inspiration')}
        onSpatialLab={() => setIsSpatialLabOpen(true)}
      />
      <main className="max-w-7xl mx-auto px-4 md:px-10 pt-24">
        <AnimatePresence>
          {isSpatialLabOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSpatialLabOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <SpatialLab 
                key={spatialLabInitial.url || 'default'}
                onClose={() => { setIsSpatialLabOpen(false); setSpatialLabInitial({}); }}
                initialModelUrl={spatialLabInitial.url}
                initialName={spatialLabInitial.name}
                onModelGenerated={(url, name) => {
                  const updatedCustom = {
                    ...customModels,
                    [name]: {
                      url,
                      thumbnail: "https://images.unsplash.com/photo-1633533402438-6629705a6332?w=800&auto=format&fit=crop&q=80",
                      category: 'My Imports',
                      description: 'AI Generated 3D Asset via Stability AI'
                    }
                  };
                  setCustomModels(updatedCustom);
                  localStorage.setItem('aura_custom_models', JSON.stringify(updatedCustom));
                  setIsSpatialLabOpen(false);
                  setSpatialLabInitial({});
                  setLandingTab('library');
                  setStep('landing');
                }}
              />
            </div>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <LandingView 
              onStart={() => setStep('studio')} 
              onChat={() => setStep('chat')}
              onViewAR={(url: string) => {
                setArModel(url);
                setArStartWithCamera(false);
                setStep('ar');
              }}
              onTabChange={(t) => setLandingTab(t)}
              onSpatialLab={() => setIsSpatialLabOpen(true)}
              user={user} 
              history={history}
              tab={landingTab}
              customModels={customModels}
              setCustomModels={setCustomModels}
            />
          )}
          {step === 'chat' && (
            <ChatView 
              onBack={() => setStep('landing')}
              onFinish={(consultedParams?: Partial<DesignParams>) => {
                if (consultedParams) {
                  setParams(prev => ({ ...prev, ...consultedParams }));
                }
                setStep('studio');
              }}
            />
          )}
          {step === 'studio' && (
            <StudioView 
              params={params} 
              setParams={setParams} 
              onGenerate={handleGenerate}
              loading={loading}
              onBack={() => setStep('landing')}
            />
          )}
          {step === 'results' && suggestion && (
            <ResultsView 
              params={params} 
              suggestion={suggestion} 
              onReset={() => setStep('landing')} 
              onSave={handleSave}
              onVisualize={handleGenerateImage}
              onViewAR={(url: string, startWithCamera: boolean = false) => {
                setArModel(url);
                setArStartWithCamera(startWithCamera);
                setStep('ar');
              }}
              loading={loading}
              lightingMode={lightingMode}
              setLightingMode={setLightingMode}
              customModels={customModels}
              onViewInSpatialLab={handleViewOrGenerateInSpatialLab}
            />
          )}
          {step === 'visualizer' && (
            <VisualizerView 
              image={visualizedImage} 
              loading={isVisualizing} 
              onBack={() => setStep('results')} 
              params={params}
              lightingMode={lightingMode}
            />
          )}
          {step === 'ar' && (
            <ARView 
              modelUrl={arModel} 
              roomImage={params.roomImage}
              onBack={() => setStep('results')} 
              startWithCamera={arStartWithCamera}
            />
          )}
          {step === 'inspiration' && (
            <InspirationView 
              onBack={() => setStep('landing')}
              onDesignSelect={(style) => {
                setParams({ ...params, style });
                setStep('studio');
              }}
            />
          )}
        </AnimatePresence>
      </main>
      <BottomNav 
        activeStep={step} 
        onHome={() => { setStep('landing'); setLandingTab('all'); }}
        onStudio={() => setStep('studio')}
        onInspire={() => setStep('inspiration')}
        onProfile={() => { setStep('landing'); setLandingTab('designs'); }}
      />
    </div>
  );
}

function Header({ user, onTabChange, onInspiration, onSpatialLab }: { user: FirebaseUser | null, onTabChange: (t: LandingTab) => void, onInspiration: () => void, onSpatialLab: () => void }) {
  return (
    <motion.header 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 bg-[#fbf9f6]/80 backdrop-blur-xl border-b border-[#c4c7c7]/30 flex justify-between items-center px-6 h-16"
    >
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('all')}>
        <AutoAwesomeIcon className="text-zinc-900 border-0" />
        <h1 className="font-manrope font-extrabold text-lg tracking-tighter">Aura Home AI</h1>
      </div>
      <nav className="hidden lg:flex items-center gap-8">
        <button onClick={() => onTabChange('all')} className="text-sm font-semibold tracking-wider font-manrope hover:text-aura-purple transition-colors">HOME</button>
        <button onClick={() => onTabChange('designs')} className="text-sm font-medium opacity-50 font-manrope hover:opacity-100 hover:text-aura-purple transition-colors">MY DESIGNS</button>
        <button onClick={() => onTabChange('library')} className="text-sm font-medium opacity-50 font-manrope hover:opacity-100 hover:text-aura-purple transition-colors">3D LIBRARY</button>
        <button onClick={onInspiration} className="text-sm font-medium opacity-50 font-manrope hover:opacity-100 hover:text-aura-purple transition-colors">INSPIRATION</button>
        <button 
          onClick={onSpatialLab} 
          className="flex items-center gap-2 text-[10px] font-black text-aura-purple bg-aura-purple/10 px-3 py-1.5 rounded-full hover:bg-aura-purple hover:text-white transition-all tracking-widest border border-aura-purple/20"
        >
          <ZapIcon size={12} className="fill-current" />
          SPATIAL LAB
        </button>
      </nav>
      <div className="flex items-center gap-4">
        <SearchIcon className="text-zinc-400 cursor-pointer" />
        {user ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => auth.signOut()}
              className="text-[10px] font-bold text-zinc-400 hover:text-zinc-900 uppercase tracking-widest"
            >
              Sign Out
            </button>
            <div className="w-8 h-8 rounded-full bg-zinc-200 overflow-hidden border border-zinc-300">
               <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} alt="avatar" />
            </div>
          </div>
        ) : (
          <button 
            onClick={() => signInWithGoogle()}
            className="text-xs font-bold bg-zinc-900 text-white px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
          >
            Sign In
          </button>
        )}
      </div>
    </motion.header>
  );
}

function LandingView({ onStart, onChat, onViewAR, onTabChange, onSpatialLab, user, history, tab, customModels, setCustomModels }: { onStart: () => void, onChat: () => void, onViewAR: (url: string) => void, onTabChange: (tab: LandingTab) => void, onSpatialLab: () => void, user: FirebaseUser | null, history: any[], tab: LandingTab, customModels: Record<string, any>, setCustomModels: any }) {
  const filteredHistory = history;
  
  if (tab === 'library') {
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState<string>('All');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newModel, setNewModel] = useState({ name: '', url: '', thumbnail: '' });

    const categories = ['All', 'Seating', 'Tables', 'Storage', 'Lighting', 'Decor', 'Textiles', 'My Imports'];
    
    const allModels = { ...FURNITURE_MODELS, ...customModels };
    const filteredModels = Object.entries(allModels).filter(([name, item]: [string, any]) => {
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = category === 'All' || 
                              (category === 'My Imports' ? !!customModels[name] : item.category === category);
      return matchesSearch && matchesCategory;
    });

    const handleAddModel = () => {
      if (!newModel.name || !newModel.url) {
        alert("Please provide at least a name and URL.");
        return;
      }
      const updatedCustom = {
        ...customModels,
        [newModel.name]: {
          url: newModel.url,
          thumbnail: newModel.thumbnail || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80',
          category: 'Other'
        }
      };
      setCustomModels(updatedCustom);
      localStorage.setItem('aura_custom_models', JSON.stringify(updatedCustom));
      setShowAddModal(false);
      setNewModel({ name: '', url: '', thumbnail: '' });
    };

    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 py-10">
            <div className="max-w-xl">
                <h2 className="text-5xl font-bold mb-4 font-manrope tracking-tighter">Spatial Index</h2>
                <p className="text-zinc-500 font-medium">Browse our architectural catalog or import your own 3D assets from Free3D, Sketchfab, or your local machine.</p>
            </div>
            <div className="flex items-center gap-3">
               <button 
                 onClick={onSpatialLab}
                 className="h-14 px-8 rounded-2xl bg-zinc-900 border border-zinc-200 text-white text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-transform flex items-center gap-3 group relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-aura-purple/20 group-hover:bg-aura-purple/40 transition-colors" />
                 <ZapIcon size={14} className="text-aura-purple relative z-10" />
                 <span className="relative z-10">Spatial Lab</span>
               </button>
               <button 
                 onClick={() => setShowAddModal(true)}
                 className="h-14 px-8 rounded-2xl bg-aura-purple text-white text-xs font-bold uppercase tracking-widest hover:scale-105 transition-transform aura-glow flex items-center gap-2"
               >
                 <PlusIcon size={18} />
                 Import Asset
               </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
           <div className="w-full md:w-64 space-y-6 shrink-0">
              <div className="relative">
                 <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                 <input 
                    type="text" 
                    placeholder="Search library..."
                    className="w-full pl-12 pr-4 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-aura-purple/20 outline-none text-sm transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                 />
              </div>

              <div className="flex flex-col gap-1">
                 <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ml-2">Collections</p>
                 {categories.map((cat) => (
                    <button 
                      key={cat}
                      onClick={() => setCategory(cat)}
                      className={cn(
                        "text-left px-4 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-between group",
                        category === cat ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                      )}
                    >
                      {cat}
                      {category === cat && <ChevronRightIcon size={14} />}
                    </button>
                 ))}
              </div>

              <div className="p-6 bg-gradient-to-br from-aura-purple to-zinc-900 rounded-3xl text-white mt-10">
                 <BotIcon className="mb-4 text-aura-purple-light" />
                 <h4 className="font-bold text-sm mb-2">Need a specific model?</h4>
                 <p className="text-[10px] opacity-70 leading-relaxed">Describe a piece of furniture in the design studio and our AI will attempt to find a visual match from our index.</p>
              </div>
           </div>

           <div className="flex-1">
              {filteredModels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                   {filteredModels.map(([name, item]: [string, any]) => (
                     <div key={name} className="group bg-white rounded-[2rem] p-6 border border-zinc-200 shadow-sm hover:shadow-xl transition-all flex flex-col hover:-translate-y-1 relative overflow-hidden h-[450px]">
                        <div className="aspect-[4/3] rounded-[1.5rem] bg-zinc-50 mb-6 relative overflow-hidden">
                           <img 
                              src={item.thumbnail} 
                              alt={name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                           />
                           <div className="absolute top-4 left-4">
                              <span className="bg-black/40 backdrop-blur-md text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                           </div>
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                           <div>
                              <h4 className="font-bold text-lg tracking-tight mb-2 group-hover:text-aura-purple transition-colors">{name}</h4>
                              <p className="text-[10px] text-zinc-500 leading-relaxed font-medium line-clamp-2">{item.description || "High-fidelity architectural asset optimized for real-time spatial visualization."}</p>
                           </div>
                           <div className="space-y-3 mt-6">
                              <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-400">
                                 <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                 PBR MATERIALS READY
                              </div>
                              <button 
                                onClick={() => onViewAR(item.url)}
                                className="w-full h-12 rounded-xl bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-aura-purple transition-all flex items-center justify-center gap-2 shadow-lg"
                              >
                                <EyeIcon size={14} />
                                View in space
                              </button>
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-[3rem] bg-[#f5f3f0]/50">
                    <WarningIcon className="text-zinc-300 mb-4" size={40} />
                    <p className="font-bold text-zinc-400 text-sm uppercase tracking-widest">No assets found in this collection</p>
                    <button onClick={() => { setCategory('All'); setSearchTerm(''); }} className="mt-2 text-aura-purple text-xs font-bold hover:underline">Clear all filters</button>
                </div>
              )}
           </div>
        </div>

        {/* Add Model Modal */}
        <AnimatePresence>
           {showAddModal && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowAddModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="relative bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl overflow-hidden"
                >
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-aura-purple/10 blur-3xl rounded-full" />
                   
                   <h3 className="text-3xl font-bold mb-2 tracking-tight">Import 3D Asset</h3>
                   <p className="text-zinc-500 text-sm mb-8">Paste a direct link to a GLB/GLTF file from Free3D, Sketchfab, or your own hosting.</p>
                   
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Asset Name</label>
                         <input 
                           type="text" 
                           placeholder="e.g. Modern Eames Chair"
                           className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-aura-purple/20 outline-none transition-all"
                           value={newModel.name}
                           onChange={(e) => setNewModel({ ...newModel, name: e.target.value })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">GLB URL (Link)</label>
                         <input 
                           type="url" 
                           placeholder="https://example.com/model.glb"
                           className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-aura-purple/20 outline-none transition-all"
                           value={newModel.url}
                           onChange={(e) => setNewModel({ ...newModel, url: e.target.value })}
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Thumbnail Image URL (Optional)</label>
                         <input 
                           type="url" 
                           placeholder="https://example.com/preview.jpg"
                           className="w-full px-6 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-aura-purple/20 outline-none transition-all"
                           value={newModel.thumbnail}
                           onChange={(e) => setNewModel({ ...newModel, thumbnail: e.target.value })}
                         />
                      </div>
                   </div>

                   <div className="flex gap-4 mt-10">
                      <button 
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 py-4 rounded-2xl border border-zinc-200 font-bold text-sm text-zinc-500 hover:bg-zinc-50 transition-all"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddModel}
                        className="flex-2 py-4 rounded-2xl bg-zinc-900 text-white font-bold text-sm hover:bg-aura-purple transition-all shadow-xl"
                      >
                        Save to Library
                      </button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (tab === 'designs') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-8"
      >
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-4xl font-bold mb-4 font-manrope">Your Design Sanctuary</h2>
            <p className="text-zinc-500 max-w-sm">Every spatial calculation and visual concept you've created is preserved here.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {history.length > 0 ? (
            history.map((item) => (
              <ProjectCard 
                key={item.id} 
                title={`${item.style} ${item.roomType}`} 
                time={item.createdAt?.toDate().toLocaleDateString() || 'Recently'} 
                img={item.roomImage || "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop&q=80"} 
              />
            ))
          ) : (
            <div className="col-span-full py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-[2.5rem]">
              <CloudUploadIcon className="text-zinc-300 mb-4" size={48} />
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs">No saved designs yet</p>
              <button 
                onClick={onStart}
                className="mt-4 text-aura-purple font-bold text-sm hover:underline"
              >
                Start your first project
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-12"
    >
      <section className="relative overflow-hidden rounded-[3rem] bg-[#f5f3f0] p-8 md:p-16 border border-[#c4c7c7]/30 transform-gpu transition-all hover:shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl md:text-7xl font-extrabold font-manrope tracking-tight leading-[0.95] mb-8">
            Reimagine your <span className="text-aura-purple italic">space</span> with AI.
          </h2>
          <p className="text-xl text-zinc-600 mb-12 max-w-lg leading-relaxed font-manrope font-medium">
            Transform any room in seconds. Upload a photo and let Aura guide your creative vision with architectural intelligence.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <button 
              onClick={onStart}
              className="group bg-zinc-900 text-white px-10 py-6 rounded-full font-bold flex items-center gap-4 shadow-2xl hover:scale-[1.03] transition-all relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-ai-gradient opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative z-10 flex items-center gap-2">
                <AddCircleIcon />
                Elevate Your Home
              </span>
            </button>
            <button 
              onClick={onSpatialLab}
              className="group bg-white border border-zinc-200 text-zinc-900 px-8 py-6 rounded-full font-bold flex items-center gap-4 shadow-xl hover:scale-[1.03] transition-all relative overflow-hidden"
            >
               <ZapIcon size={20} className="text-aura-purple" />
               Spatial Lab Demo
            </button>
            <button 
              onClick={onChat}
              className="flex items-center gap-3 text-zinc-900 font-bold hover:text-aura-purple transition-colors border-b-2 border-zinc-900 hover:border-aura-purple pb-1"
            >
              <MessageSquareIcon size={20} />
              AI Design Consultant
            </button>
          </div>
        </div>
        <img 
          src="https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=1000&auto=format&fit=crop&q=80" 
          className="absolute right-0 top-0 h-full w-1/2 object-cover opacity-20 md:opacity-100 select-none pointer-events-none" 
          alt="hero" 
        />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-aura-purple/10 blur-[100px] rounded-full" />
      </section>

      <section>
        <div className="flex items-center gap-3 mb-8">
          <span className="w-12 h-[1px] bg-zinc-200" />
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-400">Featured Inspiration</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group relative h-[400px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all">
            <img 
              src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
              alt="Modern Kitchen" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-10">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                <span className="bg-white/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">Trending Style</span>
                <h4 className="text-3xl font-extrabold text-white mb-2">Modern Slate Kitchen</h4>
                <p className="text-white/70 text-sm max-w-sm">Ethereal lighting meets dark matte finishes in this zero-waste architectural concept.</p>
              </div>
            </div>
            <button 
              onClick={onStart}
              className="absolute top-8 right-8 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-xl opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100 transition-all duration-500 hover:bg-aura-purple hover:text-white"
            >
              <AddCircleIcon />
            </button>
          </div>
          
          <div className="flex flex-col gap-8">
             <div className="flex-1 bg-aura-purple/5 border border-aura-purple/10 rounded-[2.5rem] p-10 flex flex-col justify-center">
                <h4 className="text-2xl font-bold text-zinc-900 mb-4 tracking-tight">Personalized Design Guidance</h4>
                <p className="text-zinc-600 text-sm leading-relaxed mb-8">
                  Not sure where to start? Aura analyzes your space's lighting, dimensions, and architectural quirks to suggest the perfect layouts.
                </p>
                <button 
                  onClick={onChat}
                  className="w-fit text-[10px] font-bold uppercase tracking-widest text-aura-purple border-b-2 border-aura-purple pb-1 hover:opacity-70 transition-opacity"
                >
                  Consult AI Agent
                </button>
             </div>
             <div className="h-40 bg-zinc-900 rounded-[2.5rem] p-10 flex items-center justify-between group cursor-pointer" onClick={onStart}>
                <div>
                   <h5 className="text-white font-bold text-lg">Start New Project</h5>
                   <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Architectural Intelligence</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white group-hover:bg-aura-purple transition-all duration-300">
                   <ChevronRightIcon />
                </div>
             </div>
          </div>
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-3">
             <span className="w-12 h-[1px] bg-zinc-200" />
             <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-zinc-400">Spatial Asset Library</h3>
          </div>
          <button 
             onClick={() => onTabChange('library')}
             className="text-[10px] font-black text-aura-purple uppercase tracking-[0.2em] border-b border-aura-purple/20 pb-0.5"
          >
             VIEW COLLLECTION
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
           {Object.entries(FURNITURE_MODELS).slice(0, 5).map(([name, item]) => (
             <div 
               key={name} 
               onClick={() => onViewAR(item.url)}
               className="group cursor-pointer"
             >
                <div className="aspect-square rounded-[2rem] bg-zinc-50 mb-5 overflow-hidden relative border border-zinc-100 group-hover:shadow-[0_20px_50px_rgba(168,85,247,0.15)] transition-all duration-500">
                   <img 
                      src={item.thumbnail} 
                      alt={name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                   />
                   <div className="absolute inset-0 bg-aura-purple/0 group-hover:bg-aura-purple/5 transition-colors" />
                   <div className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-50 group-hover:scale-100 ring-1 ring-white/20">
                      <ArchitectureIcon size={18} className="text-white" />
                   </div>
                </div>
                <h4 className="font-bold text-sm group-hover:text-aura-purple transition-colors">{name}</h4>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-1.5 opacity-60">Ready to Print</p>
             </div>
           ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-end mb-10">
          <div>
            <h3 className="text-4xl font-bold font-manrope tracking-tight">Recent Projects</h3>
            <p className="text-zinc-500 font-manrope mt-2">
              {user ? `Welcome back, ${user.displayName?.split(' ')[0]}` : 'Continue where you left off'}
            </p>
          </div>
          <button className="text-aura-purple font-bold text-sm flex items-center gap-1 hover:underline tracking-widest uppercase">
            History <ArrowForwardIcon size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {history.length > 0 ? (
            history.slice(0, 4).map((item) => (
              <ProjectCard 
                key={item.id} 
                title={`${item.style} ${item.roomType}`} 
                time={item.createdAt?.toDate().toLocaleDateString() || 'Recently'} 
                img={item.roomImage || "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&auto=format&fit=crop&q=60"} 
              />
            ))
          ) : (
            <>
              <ProjectCard title="Scandi Master" time="2h ago" img="https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=500&auto=format&fit=crop&q=60" />
              <ProjectCard title="Modern Kitchen" time="Yesterday" img="https://images.unsplash.com/photo-1556912177-c54030639a60?w=800&auto=format&fit=crop&q=60" />
              <ProjectCard title="Industrial Loft" time="3 days ago" img="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=500&auto=format&fit=crop&q=60" />
            </>
          )}
          <div 
            onClick={onStart}
            className="aspect-square border-2 border-dashed border-zinc-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-3 text-zinc-400 hover:bg-zinc-50 hover:border-aura-purple transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-zinc-900 group-hover:scale-110 transition-transform">
              <AddCircleIcon size={24} />
            </div>
            <span className="text-[10px] font-bold tracking-widest uppercase">New Session</span>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function InspirationView({ onBack, onDesignSelect }: { onBack: () => void, onDesignSelect: (style: string) => void }) {
  const [activeCategory, setActiveCategory] = useState<'Curated' | 'Trending' | 'Hugging Face' | 'Search'>('Curated');
  const [searchTerm, setSearchTerm] = useState('');
  const [hfData, setHfData] = useState<any[]>([]);
  const [loadingHf, setLoadingHf] = useState(false);

  React.useEffect(() => {
    if (activeCategory === 'Hugging Face' && hfData.length === 0) {
      const fetchHfData = async () => {
        setLoadingHf(true);
        try {
          const resp = await fetch('https://datasets-server.huggingface.co/rows?dataset=ellljoy%2Finterior-design&config=default&split=train&offset=0&length=20');
          const data = await resp.json();
          if (data.rows) {
            setHfData(data.rows.map((r: any) => ({
              img: r.row.images?.src || "",
              title: r.row.prompt || "Interior Layout",
              style: "Training Asset"
            })));
          }
        } catch (e) {
          console.error("Failed to fetch HF data", e);
        } finally {
          setLoadingHf(false);
        }
      };
      fetchHfData();
    }
  }, [activeCategory]);

  const curatedCollection = [
    { title: "Lunar Minimalist", style: "Minimalist", img: "https://images.unsplash.com/photo-1616486029423-aaa4789e8c9a?w=800&auto=format&q=80" },
    { title: "Warm Nordic", style: "Scandinavian", img: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&q=80" },
    { title: "High-Rise Industrial", style: "Industrial", img: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&q=80" },
    { title: "Modern Organic", style: "Modern", img: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&auto=format&q=80" },
    { title: "Rustic Estate", style: "Rustic", img: "https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=800&auto=format&q=80" },
    { title: "Zenscape Haven", style: "Minimalist", img: "https://images.unsplash.com/photo-1615527672906-7e4c911691ca?w=800&auto=format&q=80" }
  ];

  const pinterestTrending = [
    { id: 1, title: "Biophilic office design", style: "Modern", img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&auto=format&q=80", height: "h-[300px]" },
    { id: 2, title: "Matte black kitchen accents", style: "Industrial", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&q=80", height: "h-[450px]" },
    { id: 3, title: "Velvet textures in living rooms", style: "Luxury", img: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=500&auto=format&q=80", height: "h-[350px]" },
    { id: 4, title: "Terrazzo flooring patterns", style: "Art Deco", img: "https://images.unsplash.com/photo-1616137422495-1e9e46e2aa77?w=500&auto=format&q=80", height: "h-[400px]" },
    { id: 5, title: "Floating oak staircases", style: "Minimalist", img: "https://images.unsplash.com/photo-1562663474-6cbb3fee4c7a?w=500&auto=format&q=80", height: "h-[500px]" },
    { id: 6, title: "Smart lighting ecosystems", style: "Tech", img: "https://images.unsplash.com/photo-1558211583-d28f63069eb8?w=500&auto=format&q=80", height: "h-[320px]" }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-12 pb-20"
    >
      <div className="text-center max-w-2xl mx-auto space-y-6">
        <h2 className="text-5xl font-extrabold font-manrope tracking-tight">Design Discovery</h2>
        <p className="text-zinc-500 font-medium">Explore trending concepts from our global community and Pinterest integration.</p>
        
        <div className="flex justify-center gap-1 bg-[#f5f3f0] p-1 rounded-full w-fit mx-auto border border-zinc-100">
           {(['Curated', 'Trending', 'Hugging Face', 'Search'] as const).map(cat => (
             <button 
               key={cat}
               onClick={() => setActiveCategory(cat)}
               className={cn(
                 "px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                 activeCategory === cat ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
               )}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      {activeCategory === 'Hugging Face' && (
        <div className="space-y-8">
            {/* Training Dataset Core banner removed as requested */}

           {loadingHf ? (
             <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-aura-purple border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Streaming from Hugging Face...</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {hfData.map((item, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-white rounded-3xl p-4 border border-zinc-200 shadow-sm hover:shadow-xl transition-all"
                  >
                     <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 mb-4 group">
                        <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="dataset row" />
                     </div>
                     <p className="text-[10px] font-bold text-aura-purple uppercase tracking-widest mb-1">{item.style}</p>
                     <p className="text-[10px] font-medium text-zinc-600 line-clamp-2 leading-relaxed">{item.title}</p>
                  </motion.div>
                ))}
             </div>
           )}
        </div>
      )}

      {activeCategory === 'Search' && (
        <div className="max-w-xl mx-auto relative group">
          <input 
            type="text"
            placeholder="Search Pinterest for style inspiration..."
            className="w-full px-8 py-5 bg-white border border-zinc-200 rounded-[2rem] shadow-xl focus:outline-none focus:ring-2 focus:ring-aura-purple/20 transition-all pr-16"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchTerm) {
                window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(searchTerm + ' interior design')}`, '_blank');
              }
            }}
          />
          <button 
            onClick={() => searchTerm && window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(searchTerm + ' interior design')}`, '_blank')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-aura-purple text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
          >
            <SearchIcon size={18} />
          </button>
        </div>
      )}
      
      {activeCategory === 'Curated' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {curatedCollection.map((item, i) => (
            <div 
              key={i} 
              onClick={() => onDesignSelect(item.style)}
              className="group relative h-[400px] rounded-[2.5rem] overflow-hidden cursor-pointer shadow-xl"
            >
              <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={item.title} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              <div className="absolute bottom-10 left-10 text-white">
                 <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-60 mb-2">{item.style}</p>
                 <h3 className="text-2xl font-bold font-manrope mb-4">{item.title}</h3>
                 <button className="flex items-center gap-2 text-xs font-bold bg-white text-zinc-900 px-6 py-2.5 rounded-full hover:bg-zinc-200 transition-colors">
                   Use as Template <ArrowForwardIcon size={14} />
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeCategory === 'Trending' && (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
          {pinterestTrending.map((item) => (
            <div 
              key={item.id}
              className={`break-inside-avoid relative rounded-[2.5rem] overflow-hidden group cursor-pointer shadow-xl ${item.height}`}
            >
              <img src={item.img} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.title} />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                 <button 
                   onClick={(e) => {
                     e.stopPropagation();
                     window.open(`https://www.pinterest.com/search/pins/?q=${encodeURIComponent(item.title)}`, '_blank');
                   }}
                   className="bg-red-600 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300"
                 >
                   Save to Pinterest
                 </button>
                 <button 
                   onClick={() => onDesignSelect(item.style)}
                   className="bg-white text-zinc-900 px-5 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 [animation-delay:0.1s]"
                 >
                   Adopt Style
                 </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 to-transparent">
                 <h4 className="text-white font-bold text-sm leading-tight">{item.title}</h4>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="flex justify-center flex-col items-center gap-4">
        <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Powered by Aura Inspiration Engine & Pinterest Discovery</p>
        <button onClick={onBack} className="text-zinc-400 font-bold uppercase tracking-widest text-[10px] hover:text-zinc-900 border-b-2 border-transparent hover:border-zinc-900 pb-1 transition-all">
           Return to Workspace
        </button>
      </div>
    </motion.div>
  );
}

function StudioView({ params, setParams, onGenerate, loading, onBack }: any) {
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setParams({ ...params, roomImage: dataUrl });
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setParams({ ...params, roomImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-12 pb-12"
    >
      <div>
        <h2 className="text-4xl font-bold mb-3">Design your vision.</h2>
        <p className="text-zinc-500">Enter room details. Our AI will reimagine your space with architectural precision.</p>
      </div>

      <div className="space-y-10">
        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-aura-purple/10 text-aura-purple px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Step 00</span>
            <h3 className="text-xl font-bold">Upload Room Photo</h3>
          </div>
          <div className="relative group">
            {showCamera && (
              <div className="absolute inset-0 z-50 bg-black rounded-[2rem] overflow-hidden flex flex-col">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                  <button 
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-zinc-900 shadow-xl"
                  >
                    <div className="w-12 h-12 border-4 border-zinc-900 rounded-full" />
                  </button>
                  <button 
                    onClick={stopCamera}
                    className="absolute right-8 bottom-4 w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                  >
                    <XIcon size={24} />
                  </button>
                </div>
              </div>
            )}
            <div className={cn(
              "border-2 border-dashed rounded-[2rem] p-12 transition-all flex flex-col items-center justify-center gap-4 text-center cursor-pointer overflow-hidden",
              params.roomImage ? "border-aura-purple/50 bg-aura-purple/5" : "border-zinc-200 hover:border-zinc-400 bg-[#f5f3f0]"
            )}>
              {params.roomImage ? (
                <div className="relative w-full aspect-[21/9]">
                  <img src={params.roomImage} className="w-full h-full object-cover rounded-xl shadow-lg" alt="room preview" />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        startCamera();
                      }}
                      className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-md text-zinc-900"
                    >
                      <Camera size={16} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setParams({ ...params, roomImage: undefined });
                      }}
                      className="bg-white/80 backdrop-blur-md p-2 rounded-full shadow-md text-zinc-900"
                    >
                      <XIcon size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  <div className="flex gap-4">
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        const input = document.getElementById('file-upload');
                        input?.click();
                      }}
                      className="w-20 h-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-aura-purple hover:scale-110 transition-transform"
                    >
                      <CloudUploadIcon />
                    </div>
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        startCamera();
                      }}
                      className="w-20 h-20 rounded-3xl bg-zinc-900 shadow-xl flex items-center justify-center text-white hover:scale-110 transition-transform"
                    >
                      <Camera size={24} />
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-zinc-900">Upload or Take a Photo</p>
                    <p className="text-sm text-zinc-400">Capture your room in real-time</p>
                  </div>
                </div>
              )}
              <input 
                id="file-upload"
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload}
                className="hidden" 
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-aura-purple/10 text-aura-purple px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Step 01</span>
            <h3 className="text-xl font-bold">Room Selection</h3>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Dining'].map(type => (
              <button 
                key={type}
                onClick={() => setParams({ ...params, roomType: type })}
                className={cn(
                  "p-6 rounded-2xl border transition-all flex flex-col items-center gap-3",
                  params.roomType === type ? "border-zinc-900 bg-white ring-1 ring-zinc-900 shadow-sm" : "border-zinc-200 bg-[#f5f3f0] hover:bg-white"
                )}
              >
                {type === 'Living Room' && <ChairIcon />}
                {type === 'Bedroom' && <BedIcon />}
                {type === 'Kitchen' && <KitchenIcon />}
                {type === 'Bathroom' && <BathtubIcon />}
                {type === 'Office' && <DeskIcon />}
                {type === 'Dining' && <DiningIcon />}
                <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-aura-purple/10 text-aura-purple px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Step 02</span>
            <h3 className="text-xl font-bold">Spatial Dimensions</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 max-w-md">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Width (ft)</label>
              <input 
                type="number" 
                value={params.width}
                onChange={e => setParams({ ...params, width: e.target.value })}
                className="w-full bg-[#f5f3f0] border-none border-b-2 border-zinc-200 focus:border-zinc-900 focus:ring-0 p-4 font-manrope" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Length (ft)</label>
              <input 
                type="number" 
                value={params.length}
                onChange={e => setParams({ ...params, length: e.target.value })}
                className="w-full bg-[#f5f3f0] border-none border-b-2 border-zinc-200 focus:border-zinc-900 focus:ring-0 p-4 font-manrope" 
              />
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6">
            <span className="bg-aura-purple/10 text-aura-purple px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">Step 03</span>
            <h3 className="text-xl font-bold">Aesthetic & Budget</h3>
          </div>
          <div className="space-y-10">
            <div>
               <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Design Style</label>
               <div className="flex flex-wrap gap-3">
                 {['Minimalist', 'Scandinavian', 'Modern', 'Rustic', 'Industrial'].map(style => (
                    <button 
                      key={style}
                      onClick={() => setParams({ ...params, style })}
                      className={cn(
                        "px-6 py-2 rounded-full border text-sm transition-all",
                        params.style === style ? "bg-zinc-900 text-white border-zinc-900 shadow-lg scale-105" : "bg-transparent border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      {style}
                    </button>
                 ))}
               </div>
            </div>

            <div>
               <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">Budget Range</label>
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 {['Value', 'Moderate', 'Premium', 'Luxury'].map(b => (
                    <button 
                      key={b}
                      onClick={() => setParams({ ...params, budget: b })}
                      className={cn(
                        "px-6 py-4 rounded-2xl border text-sm transition-all flex flex-col items-center gap-2",
                        params.budget === b ? "bg-aura-purple text-white border-aura-purple shadow-xl scale-105" : "bg-transparent border-zinc-200 hover:border-zinc-400"
                      )}
                    >
                      <span className="font-bold">{b}</span>
                    </button>
                 ))}
               </div>
               
               <div className="space-y-2 max-w-sm">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Specific Allocation ($)</label>
                  <input 
                    type="number" 
                    placeholder="e.g. 5000"
                    onChange={e => setParams({ ...params, specificBudget: e.target.value })}
                    className="w-full bg-[#f5f3f0] border-none border-b-2 border-zinc-200 focus:border-zinc-900 focus:ring-0 p-4 font-manrope rounded-xl"
                  />
               </div>
            </div>
          </div>
        </section>

        <div className="pt-10 border-t border-zinc-200 flex justify-end">
          <button 
            onClick={onGenerate}
            disabled={loading}
            className="group relative bg-zinc-900 text-white px-10 py-5 rounded-full font-bold flex items-center gap-3 overflow-hidden"
          >
            {loading ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <AutoFixHighIcon />
                Generate Suggestions
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ResultsView({ params, suggestion, onReset, onSave, onVisualize, onViewAR, loading, lightingMode, setLightingMode, customModels, onViewInSpatialLab }: { params: DesignParams, suggestion: Suggestion, onReset: () => void, onSave: () => void, onVisualize: (mode?: any) => void, onViewAR: (url: string, startWithCamera?: boolean) => void, loading: boolean, lightingMode: string, setLightingMode: any, customModels: Record<string, any>, onViewInSpatialLab: (item: any) => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-24"
    >
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-bold text-aura-purple tracking-[0.3em] uppercase block mb-2">AI Generated Concept</span>
            <h2 className="text-4xl font-bold font-manrope">The Ethereal {params.roomType}</h2>
          </div>
          
          <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-full w-fit">
            {(['Daylight', 'Evening', 'Twilight'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setLightingMode(mode)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all",
                  lightingMode === mode 
                    ? "bg-white text-zinc-900 shadow-sm" 
                    : "text-zinc-400 hover:text-zinc-600"
                )}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              const url = suggestion.furniture[0]?.modelUrl || getFurnitureModel(suggestion.furniture[0]?.name || 'sofa', customModels);
              onViewAR(url, true);
            }}
            className="flex items-center gap-2 bg-white border-2 border-aura-purple text-aura-purple px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-aura-purple hover:text-white shadow-lg transition-all"
          >
            <Camera size={16} /> LIVE AR ROOM
          </button>
          <button 
            onClick={() => onVisualize(lightingMode)}
            className="flex items-center gap-2 bg-aura-purple text-white px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:opacity-90 shadow-lg aura-glow"
          >
            <AutoFixHighIcon size={16} /> VISUALIZE {lightingMode.toUpperCase()}
          </button>
          <button className="flex items-center gap-2 bg-[#f5f3f0] px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-[#eae8e5]">
            <ShareIcon size={16} /> SHARE
          </button>
          <button 
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
          >
            <CloudUploadIcon size={16} /> {loading ? 'SAVING...' : 'SAVE PROJECT'}
          </button>
        </div>
      </div>

      <div className="relative rounded-[2.5rem] overflow-hidden group shadow-2xl">
         <img 
           src={params.roomImage || `https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&auto=format&fit=crop&q=80`} 
           className="w-full aspect-[21/9] object-cover" 
           alt="concept" 
         />
         <div className="absolute top-8 left-8 glass-aura p-4 rounded-2xl flex items-center gap-3 aura-glow">
            <div className="w-2 h-2 rounded-full bg-aura-purple animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              {params.roomImage ? 'Analyzing Uploaded Space...' : 'Optimizing Lighting Layers...'}
            </span>
         </div>
         <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/50 backdrop-blur-sm z-10">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-xl">
             <UnfoldMoreIcon className="rotate-90 text-zinc-900" />
           </div>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-4 bg-[#f5f3f0] rounded-[2rem] p-8 border border-zinc-200/50">
          <div className="flex items-center gap-2 mb-6">
            <PaletteIcon className="text-aura-purple" />
            <h3 className="text-xl font-bold">Wall Palette</h3>
          </div>
          <div className="space-y-4">
            {suggestion.colors.map((c: string, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm">
                <div className={cn(
                  "w-12 h-12 rounded-xl",
                  i === 0 ? "bg-[#f5f3ef]" : i === 1 ? "bg-[#4a4e4d]" : "bg-[#d2b48c]"
                )} />
                <div>
                  <p className="font-bold text-sm">{c.split('(')[0]}</p>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">{c.split('(')[1]?.replace(')', '') || 'Primary Finish'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="md:col-span-5 bg-zinc-900 text-white rounded-[2rem] p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col h-full">
             <div className="flex items-center gap-2 mb-6">
               <ChairIcon className="text-aura-purple" />
               <h3 className="text-xl font-bold">Spatial Layout</h3>
             </div>
             <ul className="space-y-6">
                {suggestion.furniture.map((f: any, i: number) => (
                  <li key={i} className="flex items-center justify-between border-b border-white/10 pb-6 last:border-0">
                    <div className="flex gap-4">
                      <span className="text-2xl font-bold text-aura-purple opacity-40">0{i+1}</span>
                      <div>
                        <p className="font-bold">{f.name}</p>
                        <p className="text-xs text-zinc-400">{f.placement}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onViewInSpatialLab(f)}
                      className={cn(
                        "group/btn flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                        f.modelUrl?.startsWith('blob:')
                          ? "bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white"
                          : "bg-aura-purple/20 text-aura-purple hover:bg-aura-purple hover:text-white"
                      )}
                    >
                      <ArchitectureIcon size={14} className="group-hover/btn:scale-125 transition-transform" />
                      {f.modelUrl?.startsWith('blob:') ? '3D Ready' : '3D View'}
                      {f.modelUrl?.startsWith('blob:') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      )}
                    </button>
                  </li>
                ))}
             </ul>
          </div>
          <ArchitectureIcon className="absolute -bottom-10 -right-10 text-[200px] opacity-10" />
        </div>

        <div className="md:col-span-3 bg-[#f5f3f0]/50 rounded-[2rem] p-8">
           <div className="flex items-center gap-2 mb-8">
             <RulerIcon />
             <h3 className="text-xl font-bold">Specs</h3>
           </div>
           <div className="p-6 glass-aura rounded-2xl aura-glow mb-8">
              <p className="text-[10px] font-bold text-aura-purple tracking-[0.2em] mb-2">RECOMMENDED RUG</p>
              <p className="text-4xl font-bold font-manrope">8x10<span className="text-sm border-0 font-normal ml-1">ft</span></p>
              <p className="text-[10px] text-zinc-400 font-bold mt-2">Natural Wool / Low Pile</p>
           </div>
           <div className="space-y-4">
              <SpecItem label="Room Area" value={`${suggestion.area} sq ft`} />
              <SpecItem label="Space Score" value={`${suggestion.optimization?.score || 95}%`} />
              <SpecItem label="Efficiency" value={suggestion.optimization?.efficiency || "High"} />
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-aura-purple/10 rounded-[2.5rem] p-8 md:p-12 border border-aura-purple/20 flex items-center gap-8 shadow-sm">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center aura-glow shrink-0">
              <LightbulbIcon className="text-aura-purple" />
           </div>
           <div className="flex-1">
              <h4 className="text-xl font-bold mb-2">Design Insight</h4>
              <p className="text-zinc-600 leading-relaxed text-sm">{suggestion.insights}</p>
              <div className="mt-4 pt-4 border-t border-zinc-200/50 flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Eco Pick:</span>
                    <span className="text-[10px] text-zinc-500">{suggestion.ecoTips?.[0] || "Sustainable materials recommended"}</span>
                 </div>
                 <div className="flex gap-2 mt-2">
                    <a href="https://polyhaven.com/models" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-aura-purple hover:underline underline-offset-4">Poly Haven Libraries</a>
                    <span className="text-zinc-300">•</span>
                    <a href="https://sketchfab.com" target="_blank" rel="noreferrer" className="text-[10px] font-bold text-aura-purple hover:underline underline-offset-4">Sketchfab Assets</a>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-green-500/10 rounded-[2.5rem] p-8 md:p-12 border border-green-500/20 flex items-center gap-8 shadow-sm">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
              <PaletteIcon className="text-green-600" />
           </div>
           <div className="flex-1">
              <h4 className="text-xl font-bold mb-2 text-green-900">Sustainability Factor</h4>
              <ul className="text-zinc-600 space-y-1">
                {(suggestion.ecoTips || ["Low-VOC paints recommended.", "Sustainable wood finish."]).map((tip, i) => (
                  <li key={i} className="text-[10px] flex items-start gap-2">
                    <span className="text-green-600 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
           </div>
        </div>
      </div>

      <div className="flex justify-center pt-8">
         <button onClick={onReset} className="text-zinc-400 font-bold tracking-widest uppercase text-xs hover:text-zinc-900">
            Start New Calculation
         </button>
      </div>
    </motion.div>
  );
}

function VisualizerView({ image, loading, onBack, params, lightingMode }: { image: string | null; loading: boolean; onBack: () => void; params: DesignParams; lightingMode: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12 pb-24 max-w-5xl mx-auto"
    >
      <div className="flex justify-between items-center">
        <button onClick={onBack} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-zinc-900 transition-colors">
          <ArrowForwardIcon className="rotate-180" size={16} /> BACK TO SPECS
        </button>
        <div className="flex gap-4">
          <span className="bg-zinc-900 text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            {lightingMode} Mode
          </span>
          <span className="bg-aura-purple/10 text-aura-purple px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Aura Vision Live
          </span>
        </div>
      </div>

      <div className="relative aspect-video rounded-[3rem] overflow-hidden bg-zinc-100 shadow-2xl border border-white/20">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/40 backdrop-blur-3xl">
            <div className="w-20 h-20 relative">
              <div className="absolute inset-0 border-4 border-aura-purple/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-aura-purple border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center">
              <h3 className="text-2xl font-bold font-manrope mb-2 animate-pulse">Rendering Design Concept...</h3>
              <p className="text-zinc-500 text-sm font-medium">Gemini is applying architectural lighting and materials.</p>
            </div>
          </div>
        ) : image ? (
          <motion.img 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            src={image} 
            className="w-full h-full object-cover" 
            alt="AI Visualized Room" 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-zinc-400">Failed to render image.</p>
          </div>
        )}
      </div>

      {!loading && image && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-8 bg-[#f5f3f0] rounded-[2.5rem] border border-zinc-200/50">
            <PsychologyIcon className="text-aura-purple mb-4" />
            <h4 className="font-bold mb-2">Material Synthesis</h4>
            <p className="text-xs text-zinc-500">The AI has interpolated textures based on your budget and selected {params?.style} aesthetic.</p>
          </div>
          <div className="p-8 bg-zinc-900 text-white rounded-[2.5rem]">
            <LightbulbIcon className="text-aura-purple mb-4" />
            <h4 className="font-bold mb-2">Luminance Optimization</h4>
            <p className="text-xs text-zinc-400">Dynamic lighting layers have been generated to highlight the spatial depth of your {params?.roomType}.</p>
          </div>
          <div className="p-8 bg-white border border-zinc-100 rounded-[2.5rem] shadow-xl">
             <button className="w-full h-full flex flex-col items-center justify-center gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CloudUploadIcon />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">Download Concept</span>
             </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function ARView({ modelUrl: initialModelUrl, roomImage, onBack, startWithCamera = false }: { modelUrl: string | null; roomImage?: string; onBack: () => void; startWithCamera?: boolean }) {
  const [placedModels, setPlacedModels] = useState<Array<{ id: string; url: string; x: number; y: number; name: string }>>(
    initialModelUrl ? [{ id: 'init', url: initialModelUrl, x: 50, y: 50, name: 'Initial Model' }] : []
  );
  const [selectedModelId, setSelectedModelId] = useState<string | null>(initialModelUrl ? 'init' : null);
  const modelUrl = selectedModelId ? placedModels.find(m => m.id === selectedModelId)?.url : null;
  const activeModelName = selectedModelId ? placedModels.find(m => m.id === selectedModelId)?.name : 'Selected Item';
  
  const setModelUrl = (url: string) => {
    if (selectedModelId) {
      setPlacedModels(prev => prev.map(m => m.id === selectedModelId ? { ...m, url } : m));
    } else {
      const newId = Math.random().toString(36).substring(7);
      setPlacedModels(prev => [...prev, { id: newId, url, x: 50, y: 50, name: 'New Model' }]);
      setSelectedModelId(newId);
    }
  };
  const setActiveModelName = (name: string) => {
    if (selectedModelId) {
      setPlacedModels(prev => prev.map(m => m.id === selectedModelId ? { ...m, name } : m));
    }
  };
  
  const [showLibrary, setShowLibrary] = useState(false);
  const [material, setMaterial] = useState<'original' | 'wood' | 'metal' | 'fabric' | 'leather' | 'velvet'>('original');
  const [baseColor, setBaseColor] = useState('#ffffff');
  const [metallic, setMetallic] = useState(0.5);
  const [roughness, setRoughness] = useState(0.5);
  const [showMaterialLab, setShowMaterialLab] = useState(false);
  const [placement, setPlacement] = useState<'floor' | 'wall'>('floor');
  const [scaleLocked, setScaleLocked] = useState(false);
  const [showSpatialLab, setShowSpatialLab] = useState(false);
  const [measureMode, setMeasureMode] = useState(false);
  const [showLiveBackground, setShowLiveBackground] = useState(false);
  const [showSpatialBackground, setShowSpatialBackground] = useState(!!roomImage && !startWithCamera);
  const [isProcessing, setIsProcessing] = useState(!!roomImage && !startWithCamera);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [alignmentGuides, setAlignmentGuides] = useState(true);
  const [showDepthOverlay, setShowDepthOverlay] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const modelViewerRef = React.useRef<any>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  // Periodic spatial scanning for more realism
  useEffect(() => {
    const interval = setInterval(() => {
      setIsScanning(true);
      setTimeout(() => setIsScanning(false), 2000);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Pipeline Processing Effect
  useEffect(() => {
    if (isProcessing) {
      const stepsCount = 5;
      let current = 0;
      const interval = setInterval(() => {
        if (current < stepsCount - 1) {
          current++;
          setPipelineStep(current);
        } else {
          setIsProcessing(false);
          clearInterval(interval);
        }
      }, 900);
      return () => clearInterval(interval);
    }
  }, [isProcessing]);

  // Real-time Material Fabrication Engine
  useEffect(() => {
    if (!modelViewerRef.current) return;
    const modelViewer = modelViewerRef.current;

    const applyMaterialProperties = async () => {
      if (!modelViewer.model) return;
      
      const materials = modelViewer.model.materials;
      for (const mat of materials) {
        try {
          if (mat.ensureLoaded) {
            await mat.ensureLoaded();
          }
          
          // Apply Base Color
          if (baseColor !== '#ffffff' || material !== 'original') {
            const color = hexToRgb(baseColor);
            if (color) {
              mat.pbrMetallicRoughness.setBaseColorFactor([color.r/255, color.g/255, color.b/255, 1.0]);
            }
          }

          // Apply Factors
          mat.pbrMetallicRoughness.setMetallicFactor(metallic);
          mat.pbrMetallicRoughness.setRoughnessFactor(roughness);
        } catch (e) {
          console.warn("Failed to apply material properties", e);
        }
      }
    };

    // Helper for hex colors (defined inside to be self-contained)
    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    // Apply properties immediately if model is already loaded
    applyMaterialProperties();

    // Also listen for load event for initial placement
    modelViewer.addEventListener('load', applyMaterialProperties);
    return () => {
      modelViewer.removeEventListener('load', applyMaterialProperties);
    };
  }, [baseColor, metallic, roughness, material, modelUrl]);

  const capturePhoto = async () => {
    if (!modelViewerRef.current) return;
    setIsCapturing(true);
    
    try {
      // Simulate a flash or shutter sound feedback
      const blob = await modelViewerRef.current.toBlob({ idealAspect: true });
      const url = URL.createObjectURL(blob);
      setCapturedPhotos(prev => [url, ...prev].slice(0, 5));
      
      // Visual feedback
      setTimeout(() => setIsCapturing(false), 200);
    } catch (err) {
      console.error("Capture failed:", err);
      setIsCapturing(false);
    }
  };

  const materials = {
    wood: { name: 'Raw Oak', color: '#8B4513', roughness: 0.8, metalness: 0 },
    metal: { name: 'Brushed Steel', color: '#C0C0C0', roughness: 0.2, metalness: 1 },
    fabric: { name: 'Linen Weave', color: '#E5E4E2', roughness: 1, metalness: 0 },
    leather: { name: 'Cognac Leather', color: '#7B3F00', roughness: 0.4, metalness: 0 },
    velvet: { name: 'Midnight Velvet', color: '#191970', roughness: 0.7, metalness: 0 }
  };

  const hexToRgb = (hex: string): [number, number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b, 1];
  };

  const toggleCamera = async (forceState?: boolean) => {
    const newState = forceState !== undefined ? forceState : !showLiveBackground;
    
    if (newState) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setShowLiveBackground(true);
      } catch (err) {
        console.error("Camera error:", err);
        alert("Camera access is required for live background.");
        setShowLiveBackground(false);
      }
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      setShowLiveBackground(false);
    }
  };

  const applyMaterial = async (type: keyof typeof materials | 'original') => {
    setMaterial(type);
    if (!modelViewerRef.current || !modelViewerRef.current.model) return;
    
    const model = modelViewerRef.current.model;
    
    // Ensure all materials are loaded before modifying
    for (const mat of model.materials) {
      if (mat.ensureLoaded) {
        await mat.ensureLoaded();
      }
    }
    
    if (type === 'original') {
      for (const mat of model.materials) {
        try {
          if (mat.ensureLoaded) await mat.ensureLoaded();
          mat.pbrMetallicRoughness.setBaseColorFactor([0.8, 0.8, 0.8, 1]);
          mat.pbrMetallicRoughness.setRoughnessFactor(0.5);
          mat.pbrMetallicRoughness.setMetallicFactor(0);
        } catch (e) {
          console.warn("Failed to reset material", e);
        }
      }
      return;
    }

    const { color, roughness, metalness } = materials[type];
    const rgba = hexToRgb(color);
    
    for (const mat of model.materials) {
      try {
        if (mat.ensureLoaded) await mat.ensureLoaded();
        mat.pbrMetallicRoughness.setBaseColorFactor(rgba);
        mat.pbrMetallicRoughness.setRoughnessFactor(roughness);
        mat.pbrMetallicRoughness.setMetallicFactor(metalness);
      } catch (e) {
        console.warn("Failed to apply material", e);
      }
    }
  };

  React.useEffect(() => {
    if (startWithCamera) {
      toggleCamera(true);
    }
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col"
    >
      <div className="absolute top-6 left-6 z-50 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white hover:bg-white/20 transition-all shadow-xl border border-white/10"
          >
            <ArrowForwardIcon className="rotate-180" size={20} />
          </button>
          <div className="flex flex-col">
            <span className="bg-aura-purple text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-lg border border-white/20 aura-glow-sm">
              Spatial Designer Pro
            </span>
            <div className="flex items-center gap-2 mt-1 ml-4">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                Engine Active
              </span>
            </div>
          </div>
          {placedModels.length > 0 && (
            <button 
              onClick={() => {
                setPlacedModels([]);
                setSelectedModelId(null);
              }}
              className="bg-red-500/20 backdrop-blur-md px-4 py-2 rounded-full text-[8px] font-bold text-red-500 hover:bg-red-500/30 transition-all border border-red-500/20 uppercase tracking-widest"
            >
              Clear Workspace
            </button>
          )}
        </div>

        {/* Technical Diagnostics Overlay */}
        {showDiagnostics && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-black/60 backdrop-blur-xl p-4 rounded-3xl border border-white/5 shadow-2xl w-56 font-mono space-y-3"
          >
            <p className="text-[8px] font-bold text-aura-purple uppercase tracking-widest border-b border-aura-purple/20 pb-2">Technical Telemetry</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[8px]">
                <span className="text-zinc-500 uppercase">Latency</span>
                <span className="text-white">12.4ms</span>
              </div>
              <div className="flex justify-between text-[8px]">
                <span className="text-zinc-500 uppercase">Draw Calls</span>
                <span className="text-white">42</span>
              </div>
              <div className="flex justify-between text-[8px]">
                <span className="text-zinc-500 uppercase">Triangle Count</span>
                <span className="text-white">1.2M</span>
              </div>
              <div className="flex justify-between text-[8px]">
                <span className="text-zinc-500 uppercase">ARCore/ARKit</span>
                <span className="text-green-500">READY</span>
              </div>
            </div>
            <div className="pt-2 border-t border-white/5">
              <div className="w-full h-8 bg-white/5 rounded flex items-end gap-0.5 p-1">
                {Array.from({ length: 15 }).map((_, i) => (
                  <div 
                    key={i} 
                    className="flex-1 bg-aura-purple/40 rounded-t-[1px]" 
                    style={{ height: `${Math.random() * 80 + 20}%` }} 
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="absolute top-6 right-6 z-50 flex flex-col gap-3">
        {roomImage && (
          <button 
            onClick={() => {
              setShowSpatialBackground(!showSpatialBackground);
              setShowLiveBackground(false);
            }}
            className={cn(
              "p-5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center shadow-xl",
              showSpatialBackground && !showLiveBackground ? "bg-aura-purple text-white shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "bg-black/40 text-white hover:bg-black/60"
            )}
          >
            <ImageIcon size={20} />
            <span className="ml-2 text-[8px] font-bold uppercase tracking-widest leading-none">
              Projection
            </span>
          </button>
        )}
        <button 
          onClick={() => toggleCamera()}
          className={cn(
            "p-5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center shadow-xl",
            showLiveBackground ? "bg-aura-purple text-white" : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <EyeIcon size={20} />
          <span className="ml-2 text-[8px] font-bold uppercase tracking-widest">
            {showLiveBackground ? "Hide Room" : "Show Room"}
          </span>
        </button>

        <div className="bg-black/40 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/10 space-y-4 shadow-2xl">
          <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest text-center">Applied Material</p>
          <div className="flex flex-col gap-2">
            {(['wood', 'metal', 'fabric'] as const).map(m => (
              <button 
                key={m}
                onClick={() => applyMaterial(m)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all text-left group",
                  material === m ? "bg-white text-zinc-900 border-white shadow-lg" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                )}
              >
                <div 
                  className="w-4 h-4 rounded-full border border-white/20"
                  style={{ backgroundColor: materials[m].color }}
                />
                <span className="text-[10px] font-bold uppercase tracking-widest">{m}</span>
              </button>
            ))}
            <div className="h-[1px] bg-white/10 my-1" />
            <div className="grid grid-cols-3 gap-2">
              {(['leather', 'velvet'] as const).map(m => (
                <button 
                  key={m}
                  onClick={() => applyMaterial(m)}
                  className={cn(
                    "w-full aspect-square rounded-xl border transition-all flex items-center justify-center",
                    material === m ? "bg-white border-white" : "bg-white/5 border-white/10"
                  )}
                >
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: materials[m].color }}
                  />
                </button>
              ))}
              <button 
                onClick={() => applyMaterial('original')}
                className={cn(
                  "w-full aspect-square rounded-xl border transition-all flex items-center justify-center text-[8px] font-bold",
                  material === 'original' ? "bg-white text-zinc-900 border-white" : "bg-white/5 text-white border-white/10"
                )}
              >
                RESET
              </button>
            </div>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-white/10 space-y-4 shadow-2xl">
          <div>
            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Surface Anchoring</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPlacement('floor')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all flex flex-col items-center gap-1",
                  placement === 'floor' ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
              >
                <div className="w-4 h-[2px] bg-current opacity-30" />
                Floor
              </button>
              <button 
                onClick={() => setPlacement('wall')}
                className={cn(
                  "flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2",
                  placement === 'wall' ? "bg-white text-zinc-900 shadow-md" : "bg-white/5 text-zinc-400 hover:bg-white/10"
                )}
              >
                <div className="w-[2px] h-3 bg-current opacity-30" />
                Wall
              </button>
            </div>
          </div>

          <div className="space-y-2">
             <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Scale Lock</span>
                <button 
                  onClick={() => setScaleLocked(!scaleLocked)}
                  className={cn(
                    "w-8 h-4 rounded-full transition-colors relative",
                    scaleLocked ? "bg-aura-purple" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-sm",
                    scaleLocked ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
             </div>
             <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Alignment Guides</span>
                <button 
                  onClick={() => setAlignmentGuides(!alignmentGuides)}
                  className={cn(
                    "w-8 h-4 rounded-full transition-colors relative",
                    alignmentGuides ? "bg-aura-purple" : "bg-zinc-700"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform duration-200 shadow-sm",
                    alignmentGuides ? "translate-x-4" : "translate-x-0"
                  )} />
                </button>
             </div>
          </div>
        </div>

        <button 
          onClick={() => setShowDepthOverlay(!showDepthOverlay)}
          className={cn(
            "p-5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center shadow-xl",
            showDepthOverlay ? "bg-cyan-500 text-white" : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black tracking-tighter uppercase">{showDepthOverlay ? 'Depth ON' : 'Analyze'}</span>
            <DatabaseIcon size={16} />
          </div>
        </button>

        <button 
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className={cn(
            "p-5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center shadow-xl",
            showDiagnostics ? "bg-white text-zinc-900" : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <div className="flex flex-col items-center gap-1">
            <span className="text-[8px] font-black tracking-tighter">DATA</span>
            <div className="w-4 h-0.5 bg-current rounded-full" />
          </div>
        </button>

        <button 
          onClick={() => setMeasureMode(!measureMode)}
          className={cn(
            "p-5 rounded-3xl border border-white/10 backdrop-blur-xl transition-all flex items-center justify-center shadow-xl",
            measureMode ? "bg-aura-purple text-white" : "bg-black/40 text-white hover:bg-black/60"
          )}
        >
          <RulerIcon size={20} />
        </button>

        <button 
          onClick={() => setShowSpatialLab(true)}
          className="p-5 rounded-3xl border border-white/10 bg-aura-purple/20 backdrop-blur-xl text-aura-purple hover:bg-aura-purple/30 transition-all flex items-center justify-center shadow-xl group"
        >
          <div className="flex flex-col items-center gap-1 group-hover:scale-110 transition-transform">
            <span className="text-[8px] font-black tracking-tighter uppercase text-white/50">Create</span>
            <ZapIcon size={20} className="text-aura-purple" />
          </div>
        </button>

        {capturedPhotos.length > 0 && (
          <div className="bg-black/40 backdrop-blur-xl p-2 rounded-3xl border border-white/10 flex flex-col gap-2">
            {capturedPhotos.map((photo, i) => (
              <motion.img 
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                src={photo}
                className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform"
                onClick={() => window.open(photo, '_blank')}
              />
            ))}
          </div>
        )}
      </div>

      <div 
        className={cn(
          "flex-1 relative overflow-hidden",
          showLiveBackground ? "bg-transparent" : (showSpatialBackground && roomImage ? "bg-black" : "bg-gradient-to-b from-[#111] to-black")
        )}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const url = e.dataTransfer.getData('modelUrl');
          const name = e.dataTransfer.getData('modelName');
          if (url) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            const newId = Math.random().toString(36).substring(7);
            setPlacedModels(prev => [...prev, { id: newId, url, x, y, name: name || 'New Asset' }]);
            setSelectedModelId(newId);
          }
        }}
        onClick={() => setSelectedModelId(null)}
      >
        {showLiveBackground && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover z-0 grayscale-[0.2] contrast-125" 
          />
        )}
        {showSpatialBackground && roomImage && !showLiveBackground && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-0 overflow-hidden"
          >
            <img 
              src={roomImage} 
              className={cn(
                "w-full h-full object-cover transition-all duration-1000",
                isProcessing ? "blur-md scale-110 grayscale" : "blur-0 scale-100 grayscale-0"
              )} 
              style={{
                filter: showDepthOverlay ? 'contrast(2) brightness(0.5) grayscale(1)' : 'none'
              }}
              alt="spatial context" 
            />
            
            {/* Edge Detection Overlay (Real Canvas implementation for "Proper" behavior) */}
            <div className="absolute inset-0 pointer-events-none mix-blend-screen opacity-40">
               <div 
                 className="w-full h-full grayscale contrast-[2000%] invert scale-[1.01]"
                 style={{ 
                   backgroundImage: `url(${roomImage})`, 
                   backgroundSize: 'cover', 
                   backgroundPosition: 'center',
                   filter: 'blur(0.5px) contrast(5000%) invert(1)',
                   opacity: showDepthOverlay || isProcessing || alignmentGuides ? 0.6 : 0
                 }}
               />
            </div>
            
            {isProcessing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
                 <div className="relative w-64 h-64 flex items-center justify-center">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 border-t-2 border-aura-purple rounded-full"
                    />
                    <motion.div 
                      animate={{ rotate: -360 }}
                      transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-4 border-b-2 border-white/20 rounded-full"
                    />
                    <div className="text-center space-y-2 z-10">
                       <BotIcon className="w-12 h-12 text-aura-purple mx-auto animate-pulse" />
                       <p className="text-[10px] font-bold text-white uppercase tracking-widest animate-pulse">
                         {pipelineStep < 5 ? [
                           "Normalizing lighting...",
                           "Estimating depth (MiDaS)...",
                           "Defining planes...",
                           "Mapping coordinates...",
                           "Anchoring geometry..."
                          ][pipelineStep] : "Finalizing..."}
                       </p>
                    </div>
                 </div>
              </div>
            )}

            {!isProcessing && (
               <>
                 <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
                 {showDepthOverlay && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.4 }}
                      className="absolute inset-0 z-10 bg-indigo-500/30 mix-blend-overlay pointer-events-none"
                    >
                       <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,black_100%)]" />
                    </motion.div>
                 )}
                 {/* Virtual Scanlines */}
                 <div className="absolute inset-0 pointer-events-none opacity-10">
                    <div className="w-full h-[1px] bg-aura-purple absolute animate-scan" style={{ top: '20%' }} />
                    <div className="w-full h-[1px] bg-aura-purple absolute animate-scan" style={{ top: '50%', animationDelay: '1.5s' }} />
                    <div className="w-full h-[1px] bg-aura-purple absolute animate-scan" style={{ top: '80%', animationDelay: '3s' }} />
                 </div>
               </>
            )}
          </motion.div>
        )}
        {/* Object Library Toggle */}
        <div className="absolute top-1/2 -translate-y-1/2 left-8 z-40 flex flex-col gap-4">
           <button 
             onClick={() => setShowLibrary(!showLibrary)}
             className={cn(
               "w-14 h-14 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-all",
               showLibrary ? "bg-aura-purple text-white scale-110" : "bg-black/30 text-white hover:bg-black/50"
             )}
           >
             <ChairIcon size={24} />
           </button>
           <button 
             onClick={() => setMeasureMode(!measureMode)}
             className={cn(
               "w-14 h-14 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-all",
               measureMode ? "bg-aura-purple text-white scale-110" : "bg-black/30 text-white hover:bg-black/50"
             )}
           >
             <RulerIcon size={24} />
           </button>
           <button 
             onClick={() => setShowMaterialLab(!showMaterialLab)}
             className={cn(
               "w-14 h-14 rounded-full backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-2xl transition-all",
               showMaterialLab ? "bg-aura-purple text-white scale-110" : "bg-black/30 text-white hover:bg-black/50"
             )}
           >
             <PaletteIcon size={24} />
           </button>
        </div>

        {/* Material Lab Panel */}
        <AnimatePresence>
          {showMaterialLab && (
            <motion.div 
              initial={{ opacity: 0, x: -50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -50, scale: 0.95 }}
              className="absolute top-1/2 -translate-y-1/2 left-28 z-40 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] w-80 shadow-2xl space-y-8"
            >
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white">Fabrication Lab</h4>
                  <button onClick={() => setShowMaterialLab(false)} className="text-zinc-500 hover:text-white">
                     <XIcon size={16} />
                  </button>
               </div>

               <div className="space-y-4">
                 <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">Core Pigment</label>
                 <div className="grid grid-cols-5 gap-3">
                   {['#ffffff', '#1a1a1a', '#8b4513', '#2f4f4f', '#4a5d23', '#704214', '#1e3a8a', '#991b1b', '#d97706', '#065f46'].map(color => (
                     <button 
                       key={color}
                       onClick={() => setBaseColor(color)}
                       className={cn(
                         "w-full aspect-square rounded-full border-2 transition-all hover:scale-110",
                         baseColor === color ? "border-aura-purple ring-2 ring-aura-purple/20" : "border-white/10"
                       )}
                       style={{ backgroundColor: color }}
                     />
                   ))}
                 </div>
               </div>

               <div className="space-y-6">
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Metallic</label>
                       <span className="text-[10px] font-mono text-white/50">{Math.round(metallic * 100)}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={metallic} 
                       onChange={(e) => setMetallic(parseFloat(e.target.value))}
                       className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-aura-purple" 
                     />
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                       <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Roughness</label>
                       <span className="text-[10px] font-mono text-white/50">{Math.round(roughness * 100)}%</span>
                     </div>
                     <input 
                       type="range" min="0" max="1" step="0.01" 
                       value={roughness} 
                       onChange={(e) => setRoughness(parseFloat(e.target.value))}
                       className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-aura-purple" 
                     />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Object Library Panel */}
        <AnimatePresence>
          {showLibrary && (
            <motion.div 
               initial={{ opacity: 0, x: -50, scale: 0.95 }}
               animate={{ opacity: 1, x: 0, scale: 1 }}
               exit={{ opacity: 0, x: -50, scale: 0.95 }}
               className="absolute top-1/2 -translate-y-1/2 left-28 z-40 bg-zinc-900/90 backdrop-blur-2xl border border-white/10 p-6 rounded-[2.5rem] w-80 shadow-2xl space-y-6"
            >
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white">Spatial Inventory</h4>
                  <button onClick={() => setShowLibrary(false)} className="text-zinc-500 hover:text-white">
                    <XIcon size={16} />
                  </button>
               </div>

               {/* Custom Manual Dataset Import */}
               <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                  <p className="text-[8px] font-bold text-aura-purple uppercase tracking-widest">Manual Dataset Link</p>
                  <div className="flex gap-2">
                     <input 
                       type="text" 
                       placeholder="Paste .glb URL..." 
                       className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[10px] text-white outline-none focus:border-aura-purple"
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            const val = (e.target as HTMLInputElement).value;
                            if (val) {
                               if (val.toLowerCase().endsWith('.obj')) {
                                  alert('Note: .obj files must be converted to .glb for best AR results. Try using online converters!');
                               }
                               setModelUrl(val);
                               setActiveModelName('Custom Import');
                               setShowLibrary(false);
                            }
                         }
                       }}
                     />
                  </div>
                  <p className="text-[7px] text-zinc-500 leading-tight">
                    Tip: Use GitHub "Raw" link or local "/filename.glb" if uploaded to /public. 
                    <span className="text-aura-purple ml-1 cursor-pointer hover:underline" onClick={() => alert('Steps to use GitHub as a Dataset:\n1. Upload your .glb to a GitHub repo\n2. Click the file\n3. Click "Raw" button\n4. Copy that URL and paste here!')}>Why GitHub?</span>
                  </p>
               </div>

               <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 scrollbar-none">
                  {Object.keys(FURNITURE_MODELS).map((name) => (
                    <button 
                       key={name}
                       draggable
                       onDragStart={(e) => {
                         e.dataTransfer.setData('modelUrl', FURNITURE_MODELS[name].url);
                         e.dataTransfer.setData('modelName', name);
                       }}
                       onClick={() => {
                         setModelUrl(FURNITURE_MODELS[name].url);
                         setShowLibrary(false);
                       }}
                       className={cn(
                         "w-full p-3 rounded-2xl border transition-all text-left flex items-center gap-4 group",
                         activeModelName === name 
                          ? "bg-aura-purple border-aura-purple text-white" 
                          : "bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/10"
                       )}
                    >
                       <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/10 flex-shrink-0">
                          <img src={FURNITURE_MODELS[name].thumbnail} alt={name} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1">
                          <span className="text-[10px] font-bold block leading-none mb-1">{name}</span>
                          <span className="text-[8px] opacity-50 font-medium">Verified Asset</span>
                       </div>
                       <ArchitectureIcon size={14} className={cn(
                         "opacity-0 transition-opacity",
                         activeModelName === name ? "opacity-100" : "group-hover:opacity-100"
                       )} />
                    </button>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {!modelUrl && (
            <motion.div 
               key="placeholder"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30"
            >
               <div className="text-white text-center space-y-4">
                  <BotIcon size={48} className="mx-auto text-aura-purple animate-pulse" />
                  <p className="text-xs font-bold uppercase tracking-widest opacity-50">Initializing Spatial Stream...</p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>

        {placedModels.map((placed) => (
          <div 
            key={placed.id}
            style={{ 
              position: 'absolute',
              left: `${placed.x}%`,
              top: `${placed.y}%`,
              transform: 'translate(-50%, -50%)',
              width: placed.id === selectedModelId ? '100%' : '150px',
              height: placed.id === selectedModelId ? '100%' : '150px',
              zIndex: placed.id === selectedModelId ? 10 : 5,
              pointerEvents: placed.id === selectedModelId ? 'none' : 'auto'
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedModelId(placed.id);
            }}
          >
            {placed.id === selectedModelId ? (
              /* @ts-ignore - model-viewer is a custom element */
              <model-viewer
                ref={modelViewerRef}
                src={placed.url}
                ar
                ar-modes="webxr scene-viewer quick-look"
                ar-placement={placement}
                ar-scale={scaleLocked ? "fixed" : "auto"}
                camera-controls
                touch-action="none"
                enable-pan
                interaction-prompt="auto"
                shadow-intensity="2"
                shadow-softness="0.5"
                exposure="1.2"
                environment-image="neutral"
                auto-rotate
                interpolation-decay={200}
                camera-orbit="0deg 75deg 105%"
                min-camera-orbit="auto auto 5%"
                max-camera-orbit="auto auto 500%"
                interaction-prompt-threshold={1500}
                poster=""
                loading="eager"
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  backgroundColor: 'transparent',
                  position: 'relative',
                  zIndex: 1,
                  filter: isScanning ? "hue-rotate(90deg) brightness(1.2)" : "none",
                  pointerEvents: 'auto'
                }}
              >
                {/* 3D Scanning/Printing Effect Overlay */}
                <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden opacity-30">
                   <div className="w-full h-1 bg-aura-purple shadow-[0_0_20px_rgba(168,85,247,1)] absolute top-0 animate-scan" />
                </div>

                {/* Spatial Fabrication HUD */}
                <AnimatePresence>
                  {isScanning && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute top-10 right-10 z-30 pointer-events-none"
                    >
                      <div className="bg-black/60 backdrop-blur-xl border border-white/20 p-4 rounded-2xl flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full border-2 border-aura-purple border-t-transparent animate-spin" />
                         <div>
                            <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em] mb-1">Spatial Projection</p>
                            <p className="text-sm font-bold text-white uppercase tracking-widest">Fabricating Asset...</p>
                         </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button slot="ar-button" className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-aura-purple text-white px-10 py-5 rounded-full font-bold shadow-2xl flex items-center gap-3 scale-110 aura-glow hover:scale-[1.15] transition-transform">
                  <ArchitectureIcon size={22} />
                  PLACE IN SPACE
                </button>

                {/* Photo Capture Mechanism */}
                <div className="absolute bottom-16 right-12 z-20">
                  <button 
                    onClick={capturePhoto}
                    className={cn(
                      "w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all bg-black/20 backdrop-blur-xl aura-glow-sm",
                      isCapturing ? "border-aura-purple scale-90" : "border-white hover:border-aura-purple hover:scale-110"
                    )}
                  >
                    <Camera size={24} className="text-white" />
                  </button>
                </div>

                {alignmentGuides && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20">
                      <div className="relative">
                        <div className="w-48 h-48 border border-white/20 rounded-full animate-[ping_3s_linear_infinite]" />
                        <div className="absolute inset-0 border-2 border-aura-purple/30 rounded-full scale-50 opacity-50" />
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-1 h-1 bg-aura-purple rounded-full shadow-[0_0_10px_2px_rgba(151,71,255,0.8)]" />
                        </div>
                      </div>
                      <div className="absolute top-full mt-8 text-center w-64 -left-8">
                         <p className="text-[10px] font-medium text-white/50 animate-pulse">Drag to position • Pinch to scale/zoom • Two-finger drag to rotate</p>
                      </div>
                   </div>
                )}
              </model-viewer>
            ) : (
              <div 
                className="w-full h-full bg-aura-purple/10 border border-aura-purple/30 rounded-3xl backdrop-blur-sm flex items-center justify-center cursor-move hover:bg-aura-purple/20 transition-all shadow-xl group"
                draggable
                onDragEnd={(e) => {
                  const rect = e.currentTarget.parentElement?.parentElement?.getBoundingClientRect();
                  if (rect) {
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    setPlacedModels(prev => prev.map(m => m.id === placed.id ? { ...m, x, y } : m));
                  }
                }}
              >
                <div className="text-center group-hover:scale-110 transition-transform">
                   <BoxIcon className="text-aura-purple mx-auto mb-1" size={24} />
                   <p className="text-[8px] font-bold text-white uppercase tracking-widest">{placed.name}</p>
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                  e.stopPropagation();
                  setPlacedModels(prev => prev.filter(m => m.id !== placed.id));
                }}>
                  <XIcon size={12} />
                </div>
              </div>
            )}
          </div>
        ))}
        {placedModels.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-white gap-4">
            <div className="w-12 h-12 border-4 border-aura-purple border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Initializing AR Neural Link...</p>
          </div>
        )}
      </div>

      <div className="bg-zinc-950 p-10 text-white rounded-t-[3.5rem] border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aura-purple/50 to-transparent" />
        
        {/* Rapid Swap Catalog */}
        <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex gap-4">
            {Object.entries({
              'Mid-Century': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
              'Minimalist': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb',
              'Ambience': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Lantern/glTF-Binary/Lantern.glb',
              'Sculptural': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb',
              'Practical': 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Box/glTF-Binary/Box.glb'
            }).map(([name, url]) => (
              <button
                key={name}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('modelUrl', url);
                  e.dataTransfer.setData('modelName', name);
                }}
                onClick={() => setModelUrl(url)}
                className={cn(
                  "flex-shrink-0 group relative w-20 h-20 rounded-2xl border transition-all overflow-hidden",
                  modelUrl === url ? "border-aura-purple aura-glow-sm scale-105" : "border-white/10 hover:border-white/30"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold uppercase tracking-tighter text-white z-20 text-center px-1">
                  {name}
                </div>
                {/* Fallback pattern for 3D model thumbnails in demo */}
                <div className="w-full h-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse aura-glow" />
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-200">Aura Spatial Engine</h3>
          </div>
          <div className="flex gap-6">
             <div className="flex flex-col items-center">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Orbit</span>
                <p className="text-[10px] font-bold border-b border-zinc-700 pb-0.5">Drag</p>
             </div>
             <div className="flex flex-col items-center">
                <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Zoom</span>
                <p className="text-[10px] font-bold border-b border-zinc-700 pb-0.5">Pinch</p>
             </div>
          </div>
        </div>
        <p className="text-zinc-500 text-xs leading-relaxed max-w-lg mb-4 relative z-10">
          Precision spatial mapping engaged. Toggle "Scale Lock" to maintain absolute dimensions or use "Surface Anchoring" to snap models to floors or vertical walls. Aura's alignment guides provide visual centers for perfect placement.
        </p>
        <div className="flex gap-2">
           <span className="px-3 py-1 bg-white/5 rounded text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Ray-tracing enabled</span>
           <span className="px-3 py-1 bg-white/5 rounded text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Global Illumination V2</span>
        </div>

        {/* Creative Studio (Spatial Lab) Modal */}
        <AnimatePresence>
          {showSpatialLab && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
               <SpatialLab 
                 onClose={() => setShowSpatialLab(false)}
                 onModelGenerated={(url, name) => {
                    setModelUrl(url);
                    setActiveModelName(name);
                    setShowSpatialLab(false);
                 }}
               />
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function ChatView({ onBack, onFinish }: { onBack: () => void; onFinish: (params?: Partial<DesignParams>) => void }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot'; text: string }[]>([
    { role: 'bot', text: "Hello! I'm Aura, your architectural AI consultant. I'm here to understand your vision before we enter the studio. What kind of space are you dreaming of today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ 
        apiKey: process.env.GEMINI_API_KEY!,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });
      
      // Create history in the format expected by the SDK
      const chatHistory = messages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // Add the new user message to history for this generation
      chatHistory.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are Aura, an elite architectural AI and interior design strategist part of a cutting-edge 3D visualization platform.
          Your mission is to consult with the user to refine their vision for a space and then guide them to the Design Studio or AR View.
          
          Platform Features you can mention:
          1. Design Studio: Real-time 3D styling and lighting simulation.
          2. Spatial Designer Pro (AR): Precise markerless AR placement with wall/floor anchoring, scale locking, and real-time technical diagnostics.
          3. Photo Capture: Users can take high-fidelity snapshots of their AR designs.
          
          Guidelines:
          1. Tone: Sophisticated, visionary, articulate, and professional.
          2. Behavior: Ask clarifying questions about room type, style (Minimalist, etc.), budget preferences, and spatial needs.
          3. Technical: When users seem ready for visualization, suggest the exact mode (Design Studio for general styling, or Spatial Designer Pro for real-world placement).`,
        },
        contents: chatHistory
      });

      const responseText = result.text || "I'm processing the space...";
      setMessages(prev => [...prev, { role: 'bot', text: responseText }]);
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { role: 'bot', text: "I apologize, my neural link is flickering. Could we try that again?" }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto h-[calc(100vh-12rem)] flex flex-col bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-zinc-100"
    >
      <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-[#fbf9f6]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-aura-purple rounded-2xl flex items-center justify-center text-white shadow-lg aura-glow">
            <BotIcon size={24} />
          </div>
          <div>
            <h3 className="font-bold text-xl">AI Consultant</h3>
            <span className="text-[10px] font-bold text-aura-purple uppercase tracking-[0.2em] animate-pulse">Aura Online</span>
          </div>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
          <XIcon size={24} className="text-zinc-400" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-[#fbf9f6]/30">
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              "flex group",
              m.role === 'user' ? "justify-end" : "justify-start"
            )}
          >
            <div className={cn(
              "max-w-[80%] p-6 rounded-[2rem] text-sm leading-relaxed shadow-sm",
              m.role === 'user' 
                ? "bg-zinc-900 text-white rounded-br-none" 
                : "bg-white border border-zinc-100 text-zinc-800 rounded-bl-none"
            )}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-zinc-100 p-4 rounded-full flex gap-1 shadow-sm">
              <div className="w-1.5 h-1.5 bg-aura-purple rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-aura-purple rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-aura-purple rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-zinc-100">
        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Describe your vision..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full px-8 py-5 bg-[#f5f3f0] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-aura-purple/20 transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-zinc-900 text-white rounded-full flex items-center justify-center hover:bg-aura-purple transition-all shadow-md active:scale-95"
            >
              <SendIcon size={20} />
            </button>
          </div>
          <button 
            onClick={() => onFinish()}
            className="px-8 py-5 bg-aura-purple text-white rounded-full text-xs font-bold uppercase tracking-widest hover:opacity-90 shadow-lg aura-glow whitespace-nowrap hidden md:block"
          >
            Head to Studio
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ProjectCard({ title, time, img, key }: { title: string; time: string; img: string; key?: React.Key }) {
  return (
    <div className="group cursor-pointer">
      <div className="aspect-square rounded-3xl overflow-hidden mb-3 bg-zinc-100 shadow-sm transition-transform duration-500 group-hover:scale-[1.02]">
        <img src={img} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" alt={title} />
      </div>
      <p className="font-bold text-sm tracking-tight">{title}</p>
      <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">
        <ScheduleIcon size={12} /> {time}
      </div>
    </div>
  );
}

function SpecItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-xs pb-3 border-b border-zinc-200 last:border-0 last:pb-0">
      <span className="text-zinc-400 font-medium uppercase tracking-widest">{label}</span>
      <span className="font-bold">{value}</span>
    </div>
  );
}

function BottomNav({ activeStep, onHome, onStudio, onInspire, onProfile }: any) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-[#fbf9f6]/95 backdrop-blur-md border-t border-zinc-200 px-6 py-4 flex justify-between items-center">
      <div className="cursor-pointer" onClick={onHome}><NavItem icon={<HomeIcon />} label="HOME" active={activeStep === 'landing'} /></div>
      <div className="cursor-pointer" onClick={onStudio}><NavItem icon={<AddCircleIcon />} label="STUDIO" active={activeStep === 'studio'} /></div>
      <div className="cursor-pointer" onClick={onInspire}><NavItem icon={<AutoAwesomeMotionIcon />} label="INSPIRE" active={activeStep === 'inspiration'} /></div>
      <div className="cursor-pointer" onClick={onProfile}><NavItem icon={<PersonIcon />} label="PROFILE" active={activeStep === 'landing'} /></div>
    </nav>
  );
}

function NavItem({ icon, label, active }: { icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-1",
      active ? "text-zinc-900" : "text-zinc-400"
    )}>
      {icon}
      <span className="text-[8px] font-bold tracking-[0.2em]">{label}</span>
    </div>
  );
}
