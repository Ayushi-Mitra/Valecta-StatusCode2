"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Camera, Mic, AlertTriangle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { config } from "@/lib/config";

export default function InterviewWarning() {
  const router = useRouter();
  const [cameraAccess, setCameraAccess] = useState(false);
  const [micAccess, setMicAccess] = useState(false);
  const [requesting, setRequesting] = useState(false);

  // Check if permissions are already granted
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const cameraPermission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        const micPermission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        
        setCameraAccess(cameraPermission.state === 'granted');
        setMicAccess(micPermission.state === 'granted');
      } catch (error) {
        console.error("Error checking permissions:", error);
      }
    };
    
    checkPermissions();
  }, []);

  const requestPermissions = async () => {
    setRequesting(true);
    
    try {
      // Request camera and microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // If successful, update states
      setCameraAccess(true);
      setMicAccess(true);
      
      // Clean up
      stream.getTracks().forEach(track => track.stop());
    } catch (error) {
      console.error("Error requesting permissions:", error);
    } finally {
      setRequesting(false);
    }
  };

  const startInterview = async () => {
    try {
      // Get the jobId from URL query parameters or use a fixed value for testing
      const urlParams = new URLSearchParams(window.location.search);
      const jobId = urlParams.get('jobId') || "default-job-id"; // Fall back to a default for testing
      
      // Generate a mock session ID
      const mockSessionId = `mock-session-${Date.now()}`;
      
      // Navigate to the session page with both sessionId and jobId
      router.push(`/candidate/interview/session?sessionId=${encodeURIComponent(mockSessionId)}&jobId=${encodeURIComponent(jobId)}`);
      
      // Original API call code (commented out)
      /*
      const res = await fetch(`${config.api.baseUrl}${config.api.endpoints.session.start}`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      const sessionId = data.session_id as string;
      router.push(`/candidate/interview/session?sessionId=${encodeURIComponent(sessionId)}`);
      */
    } catch (err) {
      console.error(err);
      alert("Failed to start interview session. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/candidate/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-6 py-12 flex items-center justify-center">
        <Card className="w-full max-w-3xl border-2 border-primary/20">
          <CardHeader className="pb-4 space-y-1">
            <Badge className="w-fit bg-primary/20 text-primary mb-2">AI Interview</Badge>
            <CardTitle className="text-2xl font-bold">Prepare for Your AI Interview</CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              You are about to begin an automated interview session with our AI assistant.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Important Information</h3>
                <p className="text-sm text-muted-foreground">
                  This interview requires access to your camera and microphone. Your browser will ask for permission.
                  The interview will be recorded for assessment purposes.
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Device Permissions</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`p-4 rounded-lg border ${cameraAccess ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-secondary/30'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Camera className={`h-5 w-5 ${cameraAccess ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Camera Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {cameraAccess ? 'Permission granted' : 'Required for the interview'}
                  </p>
                </div>
                
                <div className={`p-4 rounded-lg border ${micAccess ? 'border-green-500/30 bg-green-500/10' : 'border-border bg-secondary/30'}`}>
                  <div className="flex items-center gap-3 mb-2">
                    <Mic className={`h-5 w-5 ${micAccess ? 'text-green-500' : 'text-muted-foreground'}`} />
                    <span className="font-medium">Microphone Access</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {micAccess ? 'Permission granted' : 'Required for the interview'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <h3 className="font-semibold text-lg mb-4">Interview Guidelines</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">1</span>
                  <span>Ensure you are in a quiet environment with good lighting.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">2</span>
                  <span>Position yourself centered in the camera frame.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">3</span>
                  <span>Speak clearly and at a moderate pace when answering questions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">4</span>
                  <span>The interview will last approximately 15-20 minutes.</span>
                </li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Link href="/candidate/dashboard">
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              
              {cameraAccess && micAccess ? (
                <Button 
                  onClick={startInterview}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90"
                >
                  <span>Start Interview</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button 
                  onClick={requestPermissions}
                  disabled={requesting}
                  className="w-full sm:w-auto"
                >
                  {requesting ? (
                    <span>Requesting access...</span>
                  ) : (
                    <>
                      <span>Allow Camera & Microphone</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
