import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Upload, Loader2, CheckCircle2, AlertTriangle, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ExtractedBowler {
  name: string;
  startingAverage: number;
  confidence: "high" | "medium" | "low";
}

interface ExtractedScore {
  bowlerName: string;
  game1?: number;
  game2?: number;
  game3?: number;
  confidence: "high" | "medium" | "low";
}

interface RosterScannerProps {
  onExtracted: (data: { teamName?: string; bowlers: ExtractedBowler[] }) => void;
}

interface ScoreScannerProps {
  onExtracted: (data: { scores: ExtractedScore[] }) => void;
  bowlerNames?: string[];
}

function getConfidenceIcon(confidence: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case "medium":
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    case "low":
      return <AlertTriangle className="w-4 h-4 text-red-500" />;
  }
}

function getConfidenceLabel(confidence: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return "Clear";
    case "medium":
      return "Check";
    case "low":
      return "Verify";
  }
}

export function RosterScanner({ onExtracted }: RosterScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{ teamName?: string; bowlers: ExtractedBowler[] } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/ocr/roster", { image: imageData });
      return await response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({
        title: "Roster scanned",
        description: `Found ${data.bowlers.length} bowler(s). Review and confirm the data.`,
      });
    },
    onError: () => {
      toast({
        title: "Scan failed",
        description: "Could not read the roster from the image. Try a clearer photo.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setExtractedData(null);
      scanMutation.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (extractedData) {
      onExtracted(extractedData);
      setImagePreview(null);
      setExtractedData(null);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setExtractedData(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Scan Roster Photo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-roster-camera"
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-roster-upload"
        />

        {!imagePreview ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-20 border-dashed"
              onClick={handleCapture}
              data-testid="button-capture-roster"
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-5 h-5" />
                <span className="text-xs">Take Photo</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-20 border-dashed"
              onClick={handleUpload}
              data-testid="button-upload-roster"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Upload Photo</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Roster preview"
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                onClick={handleClear}
                data-testid="button-clear-roster-image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {scanMutation.isPending && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Scanning roster...</span>
              </div>
            )}

            {extractedData && (
              <div className="space-y-3">
                {extractedData.teamName && (
                  <div className="p-2 bg-muted rounded text-sm">
                    <span className="text-muted-foreground">Team Name: </span>
                    <span className="font-medium">{extractedData.teamName}</span>
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Extracted Bowlers:</p>
                  {extractedData.bowlers.map((bowler, i) => (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {getConfidenceIcon(bowler.confidence)}
                        <span>{bowler.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{bowler.startingAverage}</span>
                        <span className="text-xs text-muted-foreground">
                          ({getConfidenceLabel(bowler.confidence)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="flex-1"
                    data-testid="button-rescan-roster"
                  >
                    Rescan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirm}
                    className="flex-1"
                    data-testid="button-confirm-roster"
                  >
                    Use This Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScoreScanner({ onExtracted, bowlerNames }: ScoreScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{ scores: ExtractedScore[] } | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scanMutation = useMutation({
    mutationFn: async (imageData: string) => {
      const response = await apiRequest("POST", "/api/ocr/scores", { 
        image: imageData,
        bowlerNames,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast({
        title: "Scores scanned",
        description: `Found scores for ${data.scores.length} bowler(s). Review and confirm the data.`,
      });
    },
    onError: () => {
      toast({
        title: "Scan failed",
        description: "Could not read scores from the image. Try a clearer photo.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImagePreview(dataUrl);
      setExtractedData(null);
      scanMutation.mutate(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = () => {
    cameraInputRef.current?.click();
  };

  const handleUpload = () => {
    uploadInputRef.current?.click();
  };

  const handleConfirm = () => {
    if (extractedData) {
      onExtracted(extractedData);
      setImagePreview(null);
      setExtractedData(null);
    }
  };

  const handleClear = () => {
    setImagePreview(null);
    setExtractedData(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = "";
    }
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Scan Score Sheet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-score-camera"
        />
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          data-testid="input-score-upload"
        />

        {!imagePreview ? (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-20 border-dashed"
              onClick={handleCapture}
              data-testid="button-capture-scores"
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-5 h-5" />
                <span className="text-xs">Take Photo</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-20 border-dashed"
              onClick={handleUpload}
              data-testid="button-upload-scores"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-5 h-5" />
                <span className="text-xs">Upload Photo</span>
              </div>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <img
                src={imagePreview}
                alt="Score sheet preview"
                className="w-full max-h-48 object-contain rounded-md bg-muted"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 bg-background/80"
                onClick={handleClear}
                data-testid="button-clear-score-image"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {scanMutation.isPending && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm text-muted-foreground">Scanning scores...</span>
              </div>
            )}

            {extractedData && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Extracted Scores:</p>
                  <div className="grid grid-cols-5 gap-1 px-2 text-xs text-muted-foreground font-medium">
                    <div className="col-span-2">Name</div>
                    <div className="text-center">G1</div>
                    <div className="text-center">G2</div>
                    <div className="text-center">G3</div>
                  </div>
                  {extractedData.scores.map((score, i) => (
                    <div 
                      key={i} 
                      className="grid grid-cols-5 gap-1 items-center p-2 bg-muted/50 rounded text-sm"
                    >
                      <div className="col-span-2 flex items-center gap-1">
                        {getConfidenceIcon(score.confidence)}
                        <span className="truncate">{score.bowlerName}</span>
                      </div>
                      <div className="text-center font-mono">{score.game1 ?? "-"}</div>
                      <div className="text-center font-mono">{score.game2 ?? "-"}</div>
                      <div className="text-center font-mono">{score.game3 ?? "-"}</div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClear}
                    className="flex-1"
                    data-testid="button-rescan-scores"
                  >
                    Rescan
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleConfirm}
                    className="flex-1"
                    data-testid="button-confirm-scores"
                  >
                    Use This Data
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
