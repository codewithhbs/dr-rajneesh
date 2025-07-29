import { useState } from "react"
import { Link, Route, Routes, Navigate, useLocation } from "react-router-dom"
import {
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Menu,
  LogOut,

} from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import DashboardHome from "./DashboardHome"

import DashboardHeader from "@/own_components/DashboardHeader"
import { ADMIN_WEB_NAME, menuSections } from "@/context/ui.constant"
import AllServices from "./services/AllServices"
import AddNewTreatMents from "./services/AddNewTreatMents"
import AllSessions from "./sessions/AllSessions"
import SessionDetails from "./sessions/SessionDetails"
import AllUsers from "./users/AllUsers"
import AllClinic from "./clinic/AllClinic"


const DashboardPage = () => {
  const location = useLocation()
  const [openSections, setOpenSections] = useState({})

  const toggleSection = (title) => {
    setOpenSections((prev) => ({
      ...prev,
      [title]: !prev[title],
    }))
  }


  const isActive = (path) => location.pathname === path


  const renderSingleMenuItem = (section) => (
    <Link key={section.to} to={section.to}>
      <Button variant={isActive(section.to) ? "secondary" : "ghost"} className="w-full justify-start gap-2 font-medium">
        {section.icon}
        <span>{section.label}</span>
        {isActive(section.to) && (
          <Badge className="ml-auto h-5 py-0" variant="outline">
            Active
          </Badge>
        )}
      </Button>
    </Link>
  )

  const renderCollapsibleMenu = (section) => (
    <Collapsible
      key={section.title}
      open={openSections[section.title]}
      onOpenChange={() => toggleSection(section.title)}
      className="w-full"
    >
      <CollapsibleTrigger asChild>
        <Button variant="ghost" className="w-full justify-between font-medium">
          <div className="flex items-center gap-2">
            {section.icon}
            <span>{section.title}</span>
          </div>
          {openSections[section.title] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-8 space-y-1">
        {section.items.map(({ to, label }) => (
          <Link key={to} to={to}>
            <Button
              variant={isActive(to) ? "secondary" : "ghost"}
              size="sm"
              className="w-full justify-start gap-2 font-normal"
            >
              <span>{label}</span>
              {isActive(to) && (
                <Badge className="ml-auto h-5 py-0" variant="outline">
                  Active
                </Badge>
              )}
            </Button>
          </Link>
        ))}
      </CollapsibleContent>
    </Collapsible>
  )

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Fixed Desktop Sidebar */}
      <aside className="hidden lg:block fixed top-0 left-0 h-full w-64 border-r bg-white z-10 overflow-hidden flex flex-col">
        <div className="p-4 flex items-center gap-2 border-b">
          <MessageSquare className="h-6 w-6 text-indigo-600" />
          <span className="font-bold text-xl">{ADMIN_WEB_NAME}</span>
        </div>

        <ScrollArea className="flex-1 px-3 py-2 h-[calc(100vh-9rem)]">
          <div className="space-y-1">
            {menuSections.map((section) =>
              section.singleItem ? renderSingleMenuItem(section) : renderCollapsibleMenu(section),
            )}
          </div>
        </ScrollArea>

        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/avatars/admin.png" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">Admin User</p>
                <p className="text-xs text-gray-500">admin@petcare.com</p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 lg:ml-64 w-full">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-indigo-600" />
                    <span>{ADMIN_WEB_NAME}</span>
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-9rem)]">
                  <div className="px-2 py-2">
                    <div className="space-y-2">
                      {menuSections.map((section) =>
                        section.singleItem ? renderSingleMenuItem(section) : renderCollapsibleMenu(section),
                      )}
                    </div>
                  </div>
                </ScrollArea>
                <div className="p-4 border-t mt-auto">
                  <Button variant="destructive" className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-bold text-lg">{ADMIN_WEB_NAME}</span>
          </div>

          <Avatar>
            <AvatarImage src="/avatars/admin.png" />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
        </header>

        {/* Desktop header */}
        <div className="hidden lg:block sticky top-0 z-10 bg-white border-b">
          <DashboardHeader />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-white p-4 md:p-6 overflow-auto">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/treatments" element={<AllServices />} />
            <Route path="/add-or-update-treatments" element={<AddNewTreatMents />} />

            {/* Sessions */}
            <Route path="/Sessions" element={<AllSessions />} />
            <Route path="/admin/sessions/:id" element={<SessionDetails />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />

            {/* All Users */}
            <Route path="/users" element={<AllUsers />} />
            <Route path="/all-clinic" element={<AllClinic />} />

          </Routes>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage