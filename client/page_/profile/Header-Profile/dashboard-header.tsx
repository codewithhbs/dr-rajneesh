"use client"

import type React from "react"

import { Activity, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardHeaderProps {
  onLogout: () => void
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onLogout }) => {
  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="flex mt-6 items-center space-x-3">
            <div className="bg-white/20 rounded-full p-2">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Patient Dashboard</h1>
              <p className="text-blue-100 text-sm">Manage your health journey</p>
            </div>
          </div>

         <Button
          className="bg-red-500 text-white hover:bg-red-600 transition-colors duration-200 mt-5"
          onClick={onLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>


        </div>
      </div>
    </header>
  )
}
export default DashboardHeader;
