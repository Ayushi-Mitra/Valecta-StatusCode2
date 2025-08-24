"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { databases, account } from "../../../appwrite";
import { Query, ID } from "appwrite";

// Use a separate uploading state for answer upload spinner
// (optional, but recommended for better UX)

export default function InterviewSession() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user ID for Appwrite queries
  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await account.get();
        setCurrentUserId(user.$id);
      } catch (e) {
        setCurrentUserId(null);
      }
    }
    fetchUser();
  }, []);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false); // <-- new state for answer upload
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [uploadsCount, setUploadsCount] = useState(0);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [currentQuestionAudioUrl, setCurrentQuestionAudioUrl] = useState<
    string | null
  >(null);
  const [currentQuestionText, setCurrentQuestionText] = useState<string | null>(
    null
  );
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const userVideoRef = useRef<HTMLVideoElement>(null);
  const botVideoRef = useRef<HTMLVideoElement>(null);

  // Initialize the camera and microphone
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        // Request specific audio constraints to ensure compatibility
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100,
          },
        });

        console.log("Media stream obtained successfully");
        console.log(
          "Audio tracks:",
          mediaStream.getAudioTracks().map((t) => t.label)
        );
        console.log(
          "Video tracks:",
          mediaStream.getVideoTracks().map((t) => t.label)
        );

        setStream(mediaStream);
        setLoading(false);

        // Set the user video stream
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = mediaStream;
        }

        // Always ensure bot video plays first, regardless of audio availability
        if (botVideoRef.current) {
          botVideoRef.current.play().catch((e) => {
            console.error("Failed to play bot video:", e);
          });
        }

        // Set a default question text in case audio fetching fails
        setCurrentQuestionText(
          "Welcome to your AI interview. Please prepare to answer questions."
        );

        // Fetch introduction audio from the start-interviews API
        try {
          // Get the job ID from the URL params
          const jobId = searchParams.get("jobId");

          if (jobId) {
            setCurrentQuestionText("Connecting to AI interviewer...");

            try {
              console.log("Fetching intro audio for job ID:", jobId);
              const startInterviewRes = await fetch("/api/start-interviews", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ jobId }),
              }).catch((e) => {
                console.error("Fetch operation failed:", e);
                return null;
              });

              console.log(
                "API response status:",
                startInterviewRes?.status,
                startInterviewRes?.statusText
              );

              if (startInterviewRes && startInterviewRes.ok) {
                try {
                  // Check if response has content
                  const audioBlob = await startInterviewRes.blob();

                  if (audioBlob.size === 0) {
                    console.error("Received empty audio blob");
                    setCurrentQuestionText(
                      "Welcome to your AI interview. Let's begin with your introduction."
                    );
                    return;
                  }

                  const url = URL.createObjectURL(audioBlob);
                  setCurrentQuestionAudioUrl(url);
                  setCurrentQuestionText(
                    "AI interviewer is introducing the session..."
                  );
                  // Play the intro audio automatically
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }

                  const audioElement = new Audio();

                  // Download and save the audio file
                  audioElement.src = url;
                  audioElement.load(); // Force loading of audio data

                  // Log the audio details for debugging
                  console.log("Audio URL created:", url);
                  console.log("Audio MIME type:", audioBlob.type);
                  console.log("Audio size:", audioBlob.size, "bytes");

                  audioElement.oncanplaythrough = () => {
                    console.log("Audio loaded and ready to play");
                    try {
                      // Add user interaction notification if needed
                      if (document.visibilityState !== "visible") {
                        console.log(
                          "Page not visible, might need user interaction"
                        );
                      }

                      audioElement
                        .play()
                        .then(() => {
                          console.log("Audio playback started successfully");
                        })
                        .catch((playError) => {
                          console.error(
                            "Failed to play audio after loading:",
                            playError
                          );
                          // If audio play fails, still proceed with the interview
                          setCurrentQuestionText(
                            "Tell me about your background and experience."
                          );
                        });
                    } catch (playError) {
                      console.error("Exception during audio play:", playError);
                      setCurrentQuestionText(
                        "Tell me about your background and experience."
                      );
                    }
                  };

                  audioElement.onended = () => {
                    console.log("Introduction audio playback completed");
                    setCurrentQuestionText(
                      "Tell me about your background and experience."
                    );
                    // Set first question count
                    setQuestionCount(1);
                  };

                  audioElement.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    // Try an alternative playback approach if initial one fails
                    try {
                      console.log("Attempting alternative playback approach");
                      const newAudio = document.createElement("audio");
                      newAudio.src = url;
                      newAudio.controls = true;
                      newAudio.style.display = "none";
                      document.body.appendChild(newAudio);
                      newAudio.play().catch((e) => {
                        console.error("Alternative playback also failed:", e);
                        document.body.removeChild(newAudio);
                      });
                      newAudio.onended = () => {
                        document.body.removeChild(newAudio);
                      };
                    } catch (altError) {
                      console.error(
                        "Alternative playback approach failed:",
                        altError
                      );
                    }
                    setCurrentQuestionText(
                      "Tell me about your background and experience."
                    );
                  };

                  audioRef.current = audioElement;
                } catch (blobError) {
                  console.error("Error processing audio blob:", blobError);
                  setCurrentQuestionText(
                    "Tell me about your background and experience."
                  );
                }
              } else {
                console.error(
                  "Failed to fetch introduction audio:",
                  startInterviewRes?.statusText || "Unknown error"
                );
                setCurrentQuestionText(
                  "Welcome to your AI interview. Let's begin with your introduction."
                );
              }
            } catch (fetchError) {
              console.error("Error in fetch operation:", fetchError);
              setCurrentQuestionText(
                "Welcome to your AI interview. Let's begin with your introduction."
              );
            }
          } else {
            console.warn("No jobId provided, cannot fetch introduction audio");
            setCurrentQuestionText(
              "Welcome to your AI interview. Let's begin with your introduction."
            );
          }
        } catch (error) {
          console.error("Error in audio fetching process:", error);
          setCurrentQuestionText(
            "Welcome to your AI interview. Let's begin with your introduction."
          );
        }
      } catch (err) {
        console.error("Error accessing media devices:", err);
        setError(
          "Failed to access camera and microphone. Please ensure permissions are granted and try again. Go back to the permissions page to request access again."
        );
        setLoading(false);
      }
    };

    initializeMedia();

    // Cleanup function
    return () => {
      stopRecording();
      // Do NOT stop the stream here; only stop in endInterview
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      // Revoke any object URLs to prevent memory leaks
      if (currentQuestionAudioUrl) {
        URL.revokeObjectURL(currentQuestionAudioUrl);
      }
    };
  }, [searchParams]);

  const uploadAnswer = async (questionNum: number) => {
    try {
      if (!jobId) {
        console.error("No jobId available for API call");
        return null;
      }

      const formData = new FormData();
      formData.append("jobId", jobId);
      formData.append("questionNum", questionNum.toString());

      // Debug FormData
      for (const [k, v] of formData.entries()) {
        console.log("formData", k, v);
      }

      let apiUrl = "/api/interview";
      if (questionNum === 5) {
        apiUrl = "/api/end-interviews";
      }

      const res = await fetch(apiUrl, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        console.error(`API error on ${apiUrl}:`, res.statusText);
        return null;
      }

      const jsonData = await res.json();
      console.log("Received JSON data:", jsonData);

      // For the 5th question, show outro text, play audio, and after audio ends, show toast and redirect
      if (questionNum === 5) {
        setCurrentQuestionText(
          jsonData.outro || "Interview complete. Thank you!"
        );
        setInterviewComplete(true);

        // Update Appwrite application status to 'results_pending'
        if (currentUserId && jobId) {
          const DATABASE_ID =
            process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ||
            "68a2abe20039e89a5206";
          const APPLICATIONS_COLLECTION_ID =
            process.env.NEXT_PUBLIC_APPWRITE_APPLICATIONS_COLLECTION_ID ||
            "applications";
          try {
            // Find the application document for this user and job
            const appRes = await databases.listDocuments(
              DATABASE_ID,
              APPLICATIONS_COLLECTION_ID,
              [
                Query.equal("userId", currentUserId),
                Query.equal("jobId", jobId),
              ]
            );
            if (appRes.documents.length > 0) {
              const appDoc = appRes.documents[0];
              await databases.updateDocument(
                DATABASE_ID,
                APPLICATIONS_COLLECTION_ID,
                appDoc.$id,
                { status: "results_pending" }
              );
            }
          } catch (err) {
            // Not fatal, but log for debugging
            console.error(
              "Failed to update application status to results_pending",
              err
            );
          }
        }

        if (jsonData.audio) {
          try {
            const b64 = jsonData.audio;
            const binary = atob(b64);
            const len = binary.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            audio.onended = () => {
              toast.success(
                "Interview ended. Thank you for your participation!"
              );
              setTimeout(() => {
                router.push("/candidate/dashboard");
              }, 1500);
            };
            audio.onerror = () => {
              toast("Interview ended. Thank you for your participation!");
              setTimeout(() => {
                router.push("/candidate/dashboard");
              }, 1500);
            };
            audio.play();
          } catch (err) {
            console.error("Error decoding/playing base64 outro audio:", err);
            toast("Interview ended. Thank you for your participation!");
            setTimeout(() => {
              router.push("/candidate/dashboard");
            }, 1500);
          }
        } else {
          toast("Interview ended. Thank you for your participation!");
          setTimeout(() => {
            router.push("/candidate/dashboard");
          }, 1500);
        }
        return jsonData;
      }

      // For questions 1-4, play audio if present
      if (jsonData.audio) {
        try {
          const b64 = jsonData.audio;
          const binary = atob(b64);
          const len = binary.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
          }
          const audioBlob = new Blob([bytes], { type: "audio/mpeg" });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.play().catch((e) => {
            console.error("Failed to play AI audio:", e);
          });
        } catch (err) {
          console.error("Error decoding/playing base64 audio:", err);
        }
      }

      setUploadsCount((prev) => prev + 1);
      setQuestionCount((prev) => (prev < 5 ? prev + 1 : prev));

      if (questionNum < 5 && jsonData && jsonData.question) {
        setCurrentQuestionText(jsonData.question);
      }

      return jsonData;
    } catch (e) {
      console.error("Failed to upload answer", e);
      return null;
    }
  };

  const startRecording = (mediaStream: MediaStream) => {
    try {
      // Ensure previous recorder is stopped
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      // Check stream validity
      if (!mediaStream || mediaStream.getAudioTracks().length === 0) {
        alert("No audio stream available.");
        return;
      }

      // Create an audio-only stream from the combined stream
      const audioStream = new MediaStream(mediaStream.getAudioTracks());

      // Try to use the most reliable audio format first
      const options: MediaRecorderOptions = {};

      // WebM is the most widely supported format for audio recording in browsers
      // This should provide consistent results across different browsers
      if (MediaRecorder.isTypeSupported("audio/webm")) {
        options.mimeType = "audio/webm";
        console.log("Using WebM audio format for recording");
      } else if (MediaRecorder.isTypeSupported("audio/ogg;codecs=opus")) {
        options.mimeType = "audio/ogg;codecs=opus";
        console.log("Using Ogg Opus audio format for recording");
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        options.mimeType = "audio/mp4";
        console.log("Using MP4 audio format for recording");
      } else {
        console.log("Using default audio format for recording");
      }

      // Create the recorder with the audio-only stream
      console.log("Creating MediaRecorder with options:", options);
      const recorder = new MediaRecorder(audioStream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      // Set up data handling
      recorder.ondataavailable = (event: BlobEvent) => {
        if (event.data && event.data.size > 0) {
          console.log(
            `Received audio chunk: ${event.data.size} bytes, type: ${event.data.type}`
          );
          chunksRef.current.push(event.data);
        }
      };

      // Handle recorder state changes for better error reporting
      recorder.onstart = () => console.log("MediaRecorder started");
      recorder.onstop = () =>
        console.log(
          "MediaRecorder stopped, chunks collected:",
          chunksRef.current.length
        );
      recorder.onerror = (event: Event) =>
        console.error("MediaRecorder error:", event);

      // Start recording with larger chunks to reduce processing overhead
      recorder.start(500);
      setIsRecording(true);
    } catch (e) {
      console.error("Failed to start MediaRecorder", e);
      alert(
        "Failed to start recording. Your browser may not support this feature."
      );
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      console.log("No active recorder to stop");
      return;
    }

    if (recorder.state !== "inactive") {
      try {
        console.log("Stopping MediaRecorder");
        recorder.stop();
      } catch (error) {
        console.error("Error stopping MediaRecorder:", error);
      }
    } else {
      console.log("MediaRecorder already inactive");
    }

    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const endInterview = async () => {
    stopRecording();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      // Fetch outro audio from the correct endpoint
      const res = await fetch("/api/end-interview", { method: "GET" });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        // Play audio and only after it ends, show toast and end session
        audio.onended = () => {
          toast.success("Interview ended. Thank you for your participation!");
          setTimeout(() => {
            router.push("/candidate/dashboard");
          }, 1500); // Give user a moment to see the toast
        };
        audio.onerror = () => {
          toast("Interview ended. Thank you for your participation!");
          setTimeout(() => {
            router.push("/candidate/dashboard");
          }, 1500);
        };
        audio.play();
      } else {
        toast("Interview ended. Thank you for your participation!");
        setTimeout(() => {
          router.push("/candidate/dashboard");
        }, 1500);
      }
    } catch (e) {
      console.error("Error ending interview:", e);
      toast("Interview ended. Thank you for your participation!");
      setTimeout(() => {
        router.push("/candidate/dashboard");
      }, 1500);
    }
  };

  const answerAndNext = async () => {
    // Prevent further answers if interview is complete
    if (interviewComplete || questionCount > 5) return;
    try {
      // If not recording, start recording
      if (!isRecording && stream) {
        startRecording(stream);
        return;
      }

      // If recording, stop recording and upload
      stopRecording();

      if (chunksRef.current.length > 0) {
        try {
          // Create a blob from the recorded chunks
          const originalBlob = new Blob(chunksRef.current, {
            type: chunksRef.current[0].type || "audio/webm",
          });
          console.log(
            "Created original blob:",
            originalBlob.type,
            originalBlob.size,
            "bytes"
          );

          // Save the audio file to the frontend/recordings directory using our API route
          const formData = new FormData();
          formData.append(
            "file",
            originalBlob,
            `question_${questionCount}_response.webm`
          );
          formData.append("questionNumber", questionCount.toString());

          try {
            // Save the recording to our local directory
            // Remove uploading state for post-5th answer
            if (questionCount <= 5) {
              setUploading(true);
            }
            const saveResponse = await fetch("/api/save-recording", {
              method: "POST",
              body: formData,
            });
            if (questionCount <= 5) {
              setUploading(false);
            }

            if (saveResponse.ok) {
              const saveResult = await saveResponse.json();
              console.log("Recording saved successfully:", saveResult.filePath);

              // Continue with the interview flow with the AI using the saved recording
              // Use the current question count (before incrementing) for the file name
              const res = await uploadAnswer(questionCount);
              chunksRef.current = [];
            } else {
              console.error(
                "Failed to save recording:",
                await saveResponse.text()
              );
              alert(
                "There was a problem saving your recording. Please try again."
              );
            }
          } catch (uploadError) {
            if (questionCount <= 5) {
              setUploading(false);
            }
            console.error("Error during audio upload:", uploadError);
            alert(
              "There was a problem uploading your audio. Please try again."
            );
          }
        } catch (processingError) {
          if (questionCount <= 5) {
            setUploading(false);
          }
          console.error("Error during audio processing:", processingError);
          alert("There was a problem with your audio. Please try again.");
        }
      } else {
        console.warn("No audio data recorded");
        alert(
          "No audio was recorded. Please try again and ensure your microphone is working."
        );
      }
    } catch (error) {
      if (questionCount <= 5) {
        setUploading(false);
      }
      console.error("Error in answerAndNext:", error);
      alert("There was a problem with the recording. Please try again.");
    }
  };

  // endInterviewAfterCompletion is no longer needed; all interview endings use endInterview

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                Connecting to interview session...
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md p-6">
              <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Camera & Microphone Access Required
              </h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button
                onClick={() => router.push("/candidate/dashboard")}
                className="bg-primary hover:bg-primary/90"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {/* User Video */}
            <div className="relative rounded-xl overflow-hidden bg-secondary/50 h-[calc(100vh-160px)] md:h-auto flex items-center justify-center border-2 border-primary/20">
              <video
                ref={userVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover transform scale-x-[-1]"
              ></video>
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium">
                You
              </div>
            </div>

            {/* AI Bot Video */}
            <div className="relative rounded-xl overflow-hidden bg-secondary/50 h-[calc(100vh-160px)] md:h-auto flex items-center justify-center border-2 border-border">
              <video
                ref={botVideoRef}
                autoPlay
                playsInline
                loop
                className="w-full h-full object-cover"
                src="/ai_interviewer.mp4"
              ></video>
              <div className="absolute bottom-4 left-4 bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium">
                AI Interviewer
              </div>

              {/* Only show question if not complete and questionCount <= 5 */}
              {currentQuestionText &&
                !interviewComplete &&
                questionCount <= 5 && (
                  <div className="absolute bottom-16 left-4 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg text-sm">
                    <p className="font-medium mb-1">Current Question:</p>
                    <p>{currentQuestionText}</p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Controls */}
        {!loading && !error && !interviewComplete && questionCount <= 5 && (
          <div className="p-4 flex justify-center">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-14 flex items-center justify-center"
              onClick={endInterview}
            >
              <Phone className="h-6 w-6 rotate-135" />
            </Button>
          </div>
        )}
        {!loading && !error && !interviewComplete && questionCount <= 5 && (
          <div className="p-4 flex justify-center gap-4">
            <Button
              onClick={answerAndNext}
              className="w-40 px-6 py-2"
              variant={isRecording ? "destructive" : "default"}
            >
              {isRecording ? "Answered" : "Send Answer"}
            </Button>
            <div className="text-sm text-muted-foreground mt-2">
              Question {questionCount}/5
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
