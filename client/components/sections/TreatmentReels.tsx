"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Play,
  Pause,
  Star,
  Eye,
  Trophy,
  Sparkles,
  Heart,
  Users,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  MoreVertical,
  Zap
} from "lucide-react"
import Link from "next/link"

const FeaturedTreatmentReels = () => {
  const [hoveredReel, setHoveredReel] = useState<number | null>(null)
  const [playingVideos, setPlayingVideos] = useState<Record<number, boolean>>({})
  const [mutedVideos, setMutedVideos] = useState<Record<number, boolean>>({})
  const [videoDurations, setVideoDurations] = useState<Record<number, string>>({})
  const [videoProgress, setVideoProgress] = useState<Record<number, number>>({})
  const videoRefs = useRef<Record<number, HTMLVideoElement>>({})
  const sliderRef = useRef<HTMLDivElement>(null)

  const reels = [
    {
      id: 1,
      title: "Cervical Pain Chiropractic Treatment",
      description: "Advanced cervical spine adjustment for instant pain relief",
      videoSrc: "/Reels/cervicle.mp4",
      views: "125K",
      likes: "8.2K",
      category: "Cervical Treatment",
      gradient: "from-blue-400 to-indigo-500",
      featured: true,
    },
    {
      id: 2,
      title: "Nose Alignment Treatment",
      description: "Precision nasal alignment technique for better breathing",
      videoSrc: "/Reels/nose.mp4",
      views: "89K",
      likes: "5.1K",
      category: "Specialized Care",
      gradient: "from-indigo-400 to-purple-500",
    },
    {
      id: 3,
      title: "Celebrity Treatment - Lalu Yadav",
      description: "Therapeutic massage treatment for political leader",
      videoSrc: "/Reels/lalu.mp4",
      views: "234K",
      likes: "18.7K",
      category: "Celebrity Care",
      gradient: "from-purple-400 to-pink-500",
      celebrity: true,
    },
    {
      id: 4,
      title: "Manoj Tiwari Treatment",
      description: "Bollywood actor receives expert chiropractic care",
      videoSrc: "/Reels/manoj.mp4",
      views: "187K",
      likes: "14.2K",
      category: "Celebrity Care",
      gradient: "from-pink-400 to-red-500",
      celebrity: true,
    },
    {
      id: 5,
      title: "Pawan Singh Power Treatment",
      description: "Bhojpuri superstar's chiropractic treatment session",
      videoSrc: "https://www.youtube.com/embed/_Wz8SESI-yg?autoplay=0&mute=1",
      views: "366K",
      likes: "11.6K",
      category: "Celebrity Care",
      gradient: "from-blue-500 to-cyan-500",
      celebrity: true,
      mostViewed: true,
    },
  ]

  // Load video durations
  useEffect(() => {
    const loadVideoDurations = async () => {
      const durations: Record<number, string> = {}
      for (const reel of reels) {
        const video = document.createElement("video")
        video.src = reel.videoSrc
        await new Promise<void>((resolve) => {
          video.addEventListener("loadedmetadata", () => {
            const minutes = Math.floor(video.duration / 60)
            const seconds = Math.floor(video.duration % 60)
            durations[reel.id] = `${minutes}:${seconds.toString().padStart(2, "0")}`
            resolve()
          })
        })
      }
      setVideoDurations(durations)
    }
    loadVideoDurations()
  }, [])

  // Video progress
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(videoRefs.current).forEach((idStr) => {
        const id = Number(idStr)
        const video = videoRefs.current[id]
        if (video && playingVideos[id]) {
          setVideoProgress((prev) => ({ ...prev, [id]: (video.currentTime / video.duration) * 100 }))
        }
      })
    }, 100)
    return () => clearInterval(interval)
  }, [playingVideos])

  const handleVideoPlay = (id: number) => {
    const video = videoRefs.current[id]
    if (!video) return

    if (playingVideos[id]) {
      video.pause()
      setPlayingVideos((prev) => ({ ...prev, [id]: false }))
    } else {
      // Pause all others
      Object.keys(videoRefs.current).forEach((key) => {
        const otherId = Number(key)
        if (otherId !== id) {
          videoRefs.current[otherId]?.pause()
          setPlayingVideos((prev) => ({ ...prev, [otherId]: false }))
        }
      })
      video.play()
      setPlayingVideos((prev) => ({ ...prev, [id]: true }))
    }
  }

  const handleVideoEnd = (id: number) => {
    setPlayingVideos((prev) => ({ ...prev, [id]: false }))
    setVideoProgress((prev) => ({ ...prev, [id]: 0 }))
  }

  const toggleMute = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const video = videoRefs.current[id]
    if (video) {
      video.muted = !video.muted
      setMutedVideos((prev) => ({ ...prev, [id]: video.muted }))
    }
  }

  const nextSlide = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.children[0].clientWidth + 16
      sliderRef.current.scrollBy({ left: slideWidth, behavior: "smooth" })
    }
  }

  const prevSlide = () => {
    if (sliderRef.current) {
      const slideWidth = sliderRef.current.children[0].clientWidth + 16
      sliderRef.current.scrollBy({ left: -slideWidth, behavior: "smooth" })
    }
  }

  const featuredReel = reels.find((r) => r.mostViewed) || reels[0]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 min-h-screen py-12 px-4">
      {/* Animated Blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-300/40 to-indigo-300/40 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-300/40 to-blue-300/40 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse delay-500 -translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <div className=" max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
            Watch{" "}
            <span className="text-transparent bg-clip-text bg-[#155DFC]">
              Healing
            </span>
          </h1>
          <p className="text-gray-600 max-w-3xl mx-auto text-lg">
            Experience the future of healthcare through our exclusive treatment reels. Real patients, real results, real transformation.
          </p>
        </div>

        {/* Featured Reel */}
        <Card className="bg-white/90 cursor-pointer backdrop-blur-xl border border-gray-200 rounded-3xl shadow-xl overflow-hidden mb-12 transform hover:scale-105 transition-all duration-500">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-5">
              <div className="lg:col-span-2 relative">
                <div className="w-full h-full overflow-hidden relative rounded-2xl">
                  <iframe
                    width="100%"
                    height="100%"
                    src="https://www.youtube.com/embed/_Wz8SESI-yg?autoplay=0&mute=1"
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full  pointer-events-none object-cover"
                  />
                </div>
              </div>
              <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col justify-center">
                <Badge
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white 
                            rounded-lg shadow-md border-0
                            bg-gradient-to-r from-red-500 via-red-600 to-red-700
                             before:inset-0 before:rounded-lg mb-4"
                >
                  <Zap className="w-3 h-3" />
                  Trending Now
                </Badge>

                <h2 className="text-2xl lg:text-4xl font-bold text-gray-800 mb-4">{featuredReel.title}</h2>
                <p className="text-gray-600 text-lg">{featuredReel.description}</p>

                <div className="flex items-center gap-6 mt-6">
                  <div className="flex items-center gap-2"><Eye className="w-5 h-5 text-blue-400" /> {featuredReel.views}</div>
                  <div className="flex items-center gap-2"><Heart className="w-5 h-5 text-red-400" /> {featuredReel.likes}</div>
                </div>

                <Button
                  className="mt-6 bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white px-8 py-4 text-lg w-full 
                                hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
         onClick={() => window.open(featuredReel?.videoSrc, "_blank")}

                >
                  {playingVideos[featuredReel.id] ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {playingVideos[featuredReel.id] ? "Pause" : "Watch"} Now
                </Button>

              </div>
            </div>
          </CardContent>
        </Card>

        {/* Horizontal Reel Slider */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800">All Treatment Reels</h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full p-2"
                onClick={prevSlide}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-full p-2"
                onClick={nextSlide}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Horizontal Scrolling Container */}
          <div
            ref={sliderRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {reels
              .filter((reel) => !reel.mostViewed)
              .map((reel) => (
                <Card
                  key={reel.id}
                  className="group relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden hover:border-gray-400 transition-all duration-500 cursor-pointer hover:-translate-y-2 hover:shadow-2xl flex-shrink-0 w-50 sm:w-72"
                  onMouseEnter={() => setHoveredReel(reel.id)}
                  onMouseLeave={() => setHoveredReel(null)}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${reel.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                  ></div>

                  <CardContent className="p-0">
                    <div className="relative aspect-[9/16] bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden">
                      <video
                        ref={(el) => (videoRefs.current[reel.id] = el)}
                        className="w-full h-full object-cover cursor-pointer"
                        playsInline
                        muted={mutedVideos[reel.id] !== false}
                        preload="metadata"
                        onClick={() => handleVideoPlay(reel.id)}
                        onEnded={() => handleVideoEnd(reel.id)}
                      >
                        <source src={reel.videoSrc} type="video/mp4" />
                      </video>

                      {/* Video Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div
                          className="absolute inset-0 flex items-center justify-center cursor-pointer"
                          onClick={() => handleVideoPlay(reel.id)}
                        >
                          {!playingVideos[reel.id] && (
                            <div
                              className={`w-16 h-16 bg-gradient-to-r ${reel.gradient} rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300`}
                            >
                              <Play className="w-8 h-8 text-gray-800 ml-0.5" fill="currentColor" />
                            </div>
                          )}
                        </div>

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          {reel.featured && (
                            <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-800 border-0 text-xs shadow-lg">
                              <Star className="w-3 h-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                          {reel.celebrity && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-gray-800 border-0 text-xs shadow-lg">
                              <Trophy className="w-3 h-3 mr-1" />
                              Celebrity
                            </Badge>
                          )}
                        </div>

                        {/* Controls */}
                        <div className="absolute top-3 right-3 flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-black/50 text-gray-800 hover:bg-black/70 rounded-full p-1.5"
                            onClick={(e) => toggleMute(reel.id, e)}
                          >
                            {mutedVideos[reel.id] !== false ? (
                              <VolumeX color={"#fff"} className="w-3 h-3" />
                            ) : (
                              <Volume2  color={"#fff"} className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="bg-black/50 text-gray-800 hover:bg-black/70 rounded-full p-1.5"
                          >
                            <MoreVertical color={"#fff"} className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Duration & Progress */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="w-full bg-white/30 rounded-full h-1 mb-2">
                            <div
                              className={`bg-gradient-to-r ${reel.gradient} h-1 rounded-full transition-all duration-100`}
                              style={{ width: `${videoProgress[reel.id] || 0}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between items-center text-gray-800 text-xs">
                            <span>{videoDurations[reel.id] || "Loading..."}</span>
                            <Badge className="bg-black/50 text-gray-800 border-0 text-xs">{reel.category}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 bg-gradient-to-br from-white/5 to-white/10">
                      <h4 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        {reel.title}
                      </h4>
                      <p className="text-gray-500 text-xs mb-3 line-clamp-2">{reel.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-blue-400" />
                            <span>{reel.views}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-red-400" />
                            <span>{reel.likes}</span>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className={`bg-gradient-to-r ${reel.gradient} text-gray-800 text-xs px-3 py-1 h-auto hover:shadow-lg transition-all duration-300`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleVideoPlay(reel.id)
                          }}
                        >
                          {playingVideos[reel.id] ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>


        {/* CTA */}
        <div className="text-center">
          <Card className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl p-8 shadow-xl">
            <h3 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-4">
              Ready for Your{" "}
              <span className="text-transparent bg-clip-text bg-[#1C63FC]">
                Transformation?
              </span>

            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands who've experienced life-changing results. Book your consultation today and become our next success story featured in our reels.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/book-consultation">
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0 hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg">
                  <Users className="w-5 h-5 mr-2" /> Book Your Session
                </Button>
              </Link>
              <Link href="https://www.youtube.com/@drrajneeshkant">
                <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg backdrop-blur-sm">
                  <Play className="w-5 h-5 mr-2" /> Watch More Reels
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  )
}

export default FeaturedTreatmentReels
