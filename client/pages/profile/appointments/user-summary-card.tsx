"use client"

import type React from "react"

import { format } from "date-fns"
import { User } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { User as UserType } from "@/types/bookings"
import Image from "next/image"

interface UserSummaryCardProps {
  user: UserType
}

export const UserSummaryCard: React.FC<UserSummaryCardProps> = ({ user }) => {
  // Calculate health score based on user activity (mock calculation)
  console.log("user", user)
  const healthScore = Math.floor(Math.random() * 40) + 60 // 60-100%

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-8">
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
          {/* Avatar Section */}
          <div className="relative group">
            {user && (
              <Avatar className="...">
                {user.profileImage?.url ? (
                  <img
                    src={user?.profileImage?.url}
                    alt={user.name}
                    onError={(e) => { e.currentTarget.src = "/placeholder.svg" }}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback>...</AvatarFallback>
                )}
              </Avatar>
            )}

            <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>

          {/* User Info Section */}
          <div className="flex-1 text-center lg:text-left space-y-4">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{user.name}</h2>
              <p className="text-gray-600 text-lg">{user.email}</p>
              {user.phone && <p className="text-gray-600">{user.phone}</p>}
            </div>

            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-4 py-2">
                Member since {format(new Date(user.createdAt), "MMM yyyy")}
              </Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2">Active Patient</Badge>
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 px-4 py-2">Verified Account</Badge>
            </div>
          </div>

          {/* Health Metrics Section */}
          <div className="bg-white rounded-xl p-6 shadow-md border border-blue-100 min-w-[280px]">
            <h3 className="font-semibold text-gray-800 mb-4 text-center">Health Overview</h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Health Score</span>
                  <span className="font-bold text-blue-600">{healthScore}%</span>
                </div>
                <Progress value={healthScore} className="h-3 bg-gray-100" />
                <p className="text-xs text-gray-500 mt-1">
                  {healthScore >= 80 ? "Excellent" : healthScore >= 60 ? "Good" : "Needs Attention"}
                </p>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Next Checkup</span>
                  <span className="text-sm font-medium text-gray-800">
                    {format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "MMM d")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
