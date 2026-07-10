"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  User,
  MapPin,
  Phone,
  Mail,
  CreditCard,
  FileText,
  Star,
  Edit,
  Plus,
  Activity,
  Stethoscope,
  Building2,
  CalendarCheck,
  AlertCircle,
  CheckCircle,
  XCircle,
  Timer,
  Download,
  Eye,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSessionBookings } from "@/hooks/sessions";
import { API_URL } from "@/constant/Urls";
import { useParams } from "react-router-dom";
import axios from "axios";

// Constants
const statusOptionsSession = [
  "Pending",
  "Confirmed",
  "Cancelled",
  "Completed",
  "Rescheduled",
  "No-Show",
];

const prescriptionTypes = [
  "Pre-Treatment",
  "Post-Treatment",
  "Follow-up",
  "Emergency",
];

const statusConfig = {
  Pending: {
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Timer,
  },
  Confirmed: {
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: CheckCircle,
  },
  Cancelled: { color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
  Completed: {
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  Rescheduled: {
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: CalendarCheck,
  },
  "No-Show": {
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: AlertCircle,
  },
};

const SessionDetails = () => {
  const { id } = useParams();
  const {
    singleSession,
    loading: sessionLoading,
    fetchSingleSessionDetails: refetch,
  } = useSessionBookings({ id });

  // Loading and Error States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog states
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [rescheduleDialog, setRescheduleDialog] = useState(false);
  const [nextSessionDialog, setNextSessionDialog] = useState(false);
  const [prescriptionDialog, setPrescriptionDialog] = useState(false);
  const [cancelReasonDialog, setCancelReasonDialog] = useState(false);

  // Form states
  const [selectedStatus, setSelectedStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleDate, setRescheduleDate] = useState();
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleSessionId, setRescheduleSessionId] = useState("");
  const [nextDate, setNextDate] = useState();
  const [nextTime, setNextTime] = useState("");
  const [prescriptionType, setPrescriptionType] = useState("");
  const [selectedSessionNumber, setSelectedSessionNumber] = useState(1);
  const [prescriptionFile, setPrescriptionFile] = useState(null);

  // Auto-clear messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Loading wrapper for API calls
  const withLoading = async (asyncFn, successMessage = "") => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await asyncFn();
      if (successMessage) {
        setSuccess(successMessage);
      }
      await refetch();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "An error occurred";
      setError(errorMessage);
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Main session status update function
  const mainSessionStatusUpdate = async (status, reason = "") => {
    if (status === "Cancelled" && !reason.trim()) {
      setCancelReasonDialog(true);
      return;
    }

    await withLoading(async () => {
      const response = await axios.post(
        `${API_URL}/admin-main-session-status-update`,
        {
          sessionId: id,
          status,
          reason: reason.trim(),
        }
      );

      setStatusUpdateDialog(false);
      setSelectedStatus("");
      setCancelReason("");
      setCancelReasonDialog(false);
    }, `Session status updated to ${status} successfully`);
  };

  // Update individual session status
  const updateSessionStatus = async ({
    sessionNumber,
    status,
    reason = "",
  }) => {
    await withLoading(async () => {
      const response = await axios.post(`${API_URL}/admin-changes-sessions`, {
        _id: id,
        sessionNumber,
        status,
        reason: reason.trim(),
      });
    }, `Session updated successfully`);
  };

  // Reschedule session
  // const handleRescheduleSession = async () => {
  //   if (!rescheduleDate || !rescheduleTime || !rescheduleSessionId) {
  //     setError("Please select date, time and session to reschedule")
  //     return
  //   }

  //   await withLoading(async () => {
  //     const response = await axios.post(`${API_URL}/admin-changes-sessions`, {
  //       _id: rescheduleSessionId,
  //       new_date: format(rescheduleDate, "yyyy-MM-dd"),
  //       new_time: rescheduleTime,
  //       status: "Rescheduled",
  //       isReschedule: true,
  //     })

  //     setRescheduleDialog(false)
  //     setRescheduleDate(undefined)
  //     setRescheduleTime("")
  //     setRescheduleSessionId("")
  //   }, "Session rescheduled successfully")
  // }

  // New Code

  const handleRescheduleSession = async () => {
    if (!rescheduleDate || !rescheduleTime || !rescheduleSessionId) {
      setError("Please select date, time and session to reschedule");
      return;
    }

    // Find the selected session from your singleSession data
    const sessionToReschedule = singleSession?.SessionDates?.find(
      (s) => s._id === rescheduleSessionId
    );

    if (!sessionToReschedule) {
      setError("Invalid session selected");
      return;
    }

    await withLoading(async () => {
      await axios.post(`${API_URL}/admin-changes-sessions`, {
        _id: id, // booking id
        sessionNumber: sessionToReschedule.sessionNumber, // send sessionNumber
        new_date: format(rescheduleDate, "yyyy-MM-dd"),
        new_time: rescheduleTime,
        status: "Rescheduled",
        isReschedule: true,
      });

      setRescheduleDialog(false);
      setRescheduleDate(undefined);
      setRescheduleTime("");
      setRescheduleSessionId("");
    }, "Session rescheduled successfully");
  };

  // Add next session (only if first session is completed)
  const handleAddNextSession = async () => {
    if (!nextDate || !nextTime) {
      setError("Please select date and time for next session");
      return;
    }

    // Check if first session is completed
    const firstSession = singleSession?.SessionDates?.find(
      (s) => s.sessionNumber === 1
    );
    if (!firstSession || firstSession.status !== "Completed") {
      setError(
        "Next session can only be added after the first session is completed"
      );
      return;
    }

    await withLoading(async () => {
      const response = await axios.post(`${API_URL}/admin-add-next-sessions`, {
        bookingId: singleSession?._id,
        new_date: format(nextDate, "yyyy-MM-dd"),
        new_time: nextTime,
      });

      setNextSessionDialog(false);
      setNextDate(undefined);
      setNextTime("");
    }, "Next session added successfully");
  };

  // Add/Update prescription
  const handleAddPrescription = async () => {
    if (!prescriptionType) {
      setError("Please select prescription type");
      return;
    }

    await withLoading(async () => {
      const formData = new FormData();
      formData.append("_id", id || "");
      formData.append("prescriptionType", prescriptionType);
      formData.append("sessionNumber", selectedSessionNumber.toString());
      if (prescriptionFile) {
        formData.append("image", prescriptionFile);
      }

      const response = await axios.post(
        `${API_URL}/admin-add-updated-prescriptions`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setPrescriptionDialog(false);
      setPrescriptionType("");
      setSelectedSessionNumber(1);
      setPrescriptionFile(null);
    }, "Prescription added successfully");
  };

  const getStatusBadge = (status) => {
    const config = statusConfig[status] || statusConfig.Pending;
    const IconComponent = config.icon;

    return (
      <Badge
        className={cn(
          "flex items-center gap-1 text-xs font-medium border",
          config.color
        )}
      >
        <IconComponent className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  // Loading component
  const LoadingSpinner = ({ message = "Loading..." }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <p className="text-gray-600">{message}</p>
    </div>
  );

  // Error component
  const ErrorDisplay = ({ message, onRetry }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <AlertTriangle className="w-12 h-12 text-red-500" />
      <p className="text-red-600 text-center">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );

  if (!id) {
    return <ErrorDisplay message="Session ID not found" />;
  }

  if (sessionLoading) {
    return <LoadingSpinner message="Loading session details..." />;
  }

  if (!singleSession) {
    return <ErrorDisplay message="Session not found" onRetry={refetch} />;
  }

  const canAddNextSession = singleSession?.SessionDates?.some(
    (s) => s.sessionNumber === 1 && s.status === "Completed"
  );

  return (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
    {/* Loading Overlay */}
    {loading && (
      <div className="fixed inset-0 bg-black/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] max-w-[90vw]">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 dark:text-gray-300 font-medium">
            Processing request...
          </p>
        </div>
      </div>
    )}

        {/* Alert Messages */}
       {error && (
        <Alert variant="destructive" className="border-red-400/30 bg-red-50/80 dark:bg-red-950/30 dark:border-red-800/40">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-500" />
          <AlertDescription className="text-red-800 dark:text-red-300">
            {error}
          </AlertDescription>
        </Alert>
      )}

       {success && (
        <Alert className="border-green-400/30 bg-green-50/80 dark:bg-green-950/30 dark:border-green-800/40">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-800 dark:text-green-300">
            {success}
          </AlertDescription>
        </Alert>
      )}

        {/* Header */}
        {/* ==================== SESSION HEADER CARD ==================== */}
        <Card className="border border-gray-200 dark:border-gray-800 shadow-md dark:shadow-xl overflow-hidden">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-gray-900 dark:to-gray-800 px-6 py-7 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Session Management
                </h1>
                <p className="mt-1.5 text-blue-100/90 dark:text-gray-300 text-lg">
                  Booking #{singleSession?.bookingNumber || "—"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="outline"
                  className="bg-red-600/90 text-white border-none px-4 py-1.5 text-sm font-semibold shadow-sm"
                >
                  {singleSession?.priority || "Normal"} Priority
                </Badge>

                <Badge
                  variant="outline"
                  className="bg-blue-600/90 text-white border-none px-4 py-1.5 text-sm font-semibold shadow-sm"
                >
                  Source: {singleSession?.bookingSource || "Unknown"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Content area */}
          <div className="p-6 bg-white dark:bg-gray-900">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 flex-wrap">
              {/* Left: Status + Created date */}
              <div className="flex items-center gap-5 flex-wrap">
                {getStatusBadge(singleSession?.session_status)}

                <Separator orientation="vertical" className="h-6 hidden sm:block" />

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Created:{" "}
                  {singleSession?.createdAt
                    ? format(new Date(singleSession.createdAt), "PPP p")
                    : "—"}
                </div>
              </div>

              {/* Right: Action buttons */}
              <div className="flex flex-wrap gap-3">
                {/* Update Status Dialog Trigger */}
                <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={loading}
                      className="gap-2 bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Update Status
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Update Main Session Status</DialogTitle>
                      <DialogDescription>
                        Change the overall status of this booking.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="py-5">
                      <Label htmlFor="status" className="mb-2 block">
                        New Status
                      </Label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder="Select new status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptionsSession.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setStatusUpdateDialog(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => mainSessionStatusUpdate(selectedStatus)}
                        disabled={!selectedStatus || loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Status
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Add Next Session Dialog Trigger */}
                <Dialog open={nextSessionDialog} onOpenChange={setNextSessionDialog}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={!canAddNextSession || loading}
                      className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Next Session
                    </Button>
                  </DialogTrigger>

                  <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add Next Session</DialogTitle>
                      <DialogDescription>
                        Schedule the next appointment for this patient.
                        {!canAddNextSession && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2 font-medium">
                            First session must be completed before adding the next one.
                          </p>
                        )}
                      </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-5">
                      <div>
                        <Label>Select Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal mt-1.5",
                                !nextDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {nextDate ? format(nextDate, "PPP") : "Pick a date"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={nextDate}
                              onSelect={setNextDate}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div>
                        <Label htmlFor="time">Time</Label>
                        <Input
                          id="time"
                          type="time"
                          value={nextTime}
                          onChange={(e) => setNextTime(e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setNextSessionDialog(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleAddNextSession}
                        disabled={!nextDate || !nextTime || loading}
                      >
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Add Session
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>

        {/* ==================== CANCEL REASON DIALOG ==================== */}
        <Dialog open={cancelReasonDialog} onOpenChange={setCancelReasonDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Cancellation Reason</DialogTitle>
              <DialogDescription>
                Please provide a reason for cancelling this session. This helps improve service quality.
              </DialogDescription>
            </DialogHeader>

            <div className="py-5">
              <Label htmlFor="cancelReason" className="mb-2 block">
                Reason for Cancellation
              </Label>
              <Textarea
                id="cancelReason"
                placeholder="Enter detailed reason..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="min-h-[100px] resize-none"
                required
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCancelReasonDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                onClick={() => mainSessionStatusUpdate("Cancelled", cancelReason)}
                disabled={!cancelReason.trim() || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Cancellation
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Dialog */}
        <Dialog open={rescheduleDialog} onOpenChange={setRescheduleDialog}>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader className="space-y-1.5">
              <DialogTitle className="text-xl font-semibold">
                Reschedule Session
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Choose a new date and time for the selected session.
              </DialogDescription>
            </DialogHeader>

            <div className="py-5 space-y-6">
              {/* Select which session to reschedule */}
              <div className="space-y-2">
                <Label htmlFor="session-select" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Select Session
                </Label>
                <Select
                  value={rescheduleSessionId}
                  onValueChange={setRescheduleSessionId}
                >
                  <SelectTrigger
                    id="session-select"
                    className="border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/70"
                  >
                    <SelectValue placeholder="Choose a session to reschedule" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {singleSession?.SessionDates
                      ?.filter(s => s.status === "Pending" || s.status === "Confirmed")
                      ?.map((session) => (
                        <SelectItem
                          key={session._id}
                          value={session._id}
                          className="py-2.5"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">
                              Session {session.sessionNumber}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(new Date(session.date), "PPP")} • {session.time}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* New Date */}
              <div className="space-y-2">
                <Label htmlFor="new-date" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      id="new-date"
                      className={cn(
                        "w-full justify-start text-left font-normal border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800",
                        !rescheduleDate && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400" />
                      {rescheduleDate
                        ? format(rescheduleDate, "PPP")
                        : "Select new date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={rescheduleDate}
                      onSelect={setRescheduleDate}
                      initialFocus
                      disabled={(date) => date < new Date()}
                      className="rounded-md border border-gray-200 dark:border-gray-700"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* New Time */}
              <div className="space-y-2">
                <Label htmlFor="new-time" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Time
                </Label>
                <Input
                  id="new-time"
                  type="time"
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-500/70"
                />
              </div>
            </div>

            <DialogFooter className="gap-3 sm:gap-4">
              <Button
                variant="outline"
                onClick={() => setRescheduleDialog(false)}
                disabled={loading}
                className="border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>

              <Button
                onClick={handleRescheduleSession}
                disabled={
                  !rescheduleDate ||
                  !rescheduleTime ||
                  !rescheduleSessionId ||
                  loading
                }
                className={cn(
                  "min-w-[120px] bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800",
                  "text-white shadow-sm transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reschedule
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="
    grid w-full grid-cols-5 
    bg-gray-100 dark:bg-gray-900 
    border border-gray-200 dark:border-gray-700 
    rounded-xl p-1.5 
    shadow-sm
  ">
            <TabsTrigger
              value="overview"
              className="
        rounded-lg text-sm font-medium
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200/70 dark:hover:bg-gray-800/70
        data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
        data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
        data-[state=active]:shadow-sm
        transition-all duration-200
      "
            >
              Overview
            </TabsTrigger>

            <TabsTrigger
              value="patient"
              className="
        rounded-lg text-sm font-medium
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200/70 dark:hover:bg-gray-800/70
        data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
        data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
        data-[state=active]:shadow-sm
        transition-all duration-200
      "
            >
              Patient
            </TabsTrigger>

            <TabsTrigger
              value="treatment"
              className="
        rounded-lg text-sm font-medium
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200/70 dark:hover:bg-gray-800/70
        data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
        data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
        data-[state=active]:shadow-sm
        transition-all duration-200
      "
            >
              Treatment
            </TabsTrigger>

            <TabsTrigger
              value="sessions"
              className="
        rounded-lg text-sm font-medium
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200/70 dark:hover:bg-gray-800/70
        data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
        data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
        data-[state=active]:shadow-sm
        transition-all duration-200
      "
            >
              Sessions
            </TabsTrigger>

            <TabsTrigger
              value="prescriptions"
              className="
        rounded-lg text-sm font-medium
        text-gray-700 dark:text-gray-300
        hover:bg-gray-200/70 dark:hover:bg-gray-800/70
        data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800
        data-[state=active]:text-gray-900 dark:data-[state=active]:text-white
        data-[state=active]:shadow-sm
        transition-all duration-200
      "
            >
              Prescriptions
            </TabsTrigger>
          </TabsList>

 <TabsContent value="overview" className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {/* Total Sessions */}
    <Card className="bg-gradient-to-tr from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/20 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl text-blue-950 dark:text-blue-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Activity className="h-10 w-10 text-blue-600 dark:text-blue-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Total Sessions</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {singleSession?.no_of_session_book}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Completed */}
    <Card className="bg-gradient-to-tr from-green-50 to-green-100 dark:from-green-950/30 dark:to-green-900/20 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl text-green-950 dark:text-green-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Completed</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {singleSession?.completedSessionsCount}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Total Amount */}
    <Card className="bg-gradient-to-tr from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/20 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl text-purple-950 dark:text-purple-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <CreditCard className="h-10 w-10 text-purple-600 dark:text-purple-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Total Amount</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(singleSession?.totalAmount)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Progress */}
    <Card className="bg-gradient-to-tr from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl text-orange-950 dark:text-orange-100">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Timer className="h-10 w-10 text-orange-600 dark:text-orange-500" />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-400">Progress</p>
            <p className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {singleSession?.progressPercentage}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Progress Bar Card */}
  <Card className="border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300 bg-white dark:bg-gray-900">
    <CardHeader className="pb-2">
      <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
        Treatment Progress
      </CardTitle>
      <CardDescription className="text-gray-500 dark:text-gray-400 text-sm">
        Overall session completion status
      </CardDescription>
    </CardHeader>
    <CardContent className="pt-4">
      <div className="space-y-4">
        <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300">
          <span>Progress</span>
          <span>{singleSession?.progressPercentage}%</span>
        </div>

        <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-5 overflow-hidden border border-gray-300 dark:border-gray-700">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-500 dark:to-indigo-500 flex items-center justify-end pr-3 text-white text-xs font-semibold transition-all duration-500 shadow-inner"
            style={{ width: `${singleSession?.progressPercentage}%` }}
          >
            {singleSession?.progressPercentage > 10 && `${singleSession?.progressPercentage}%`}
          </div>
        </div>

        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>{singleSession?.completedSessionsCount} completed</span>
          <span>
            {singleSession?.no_of_session_book - (singleSession?.completedSessionsCount || 0)} remaining
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</TabsContent>

<TabsContent value="patient" className="space-y-6">
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Patient Information */}
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <User className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Patient Information
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Profile Section */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-offset-2 ring-blue-100 dark:ring-blue-900/40">
            {singleSession?.session_booking_user?.profileImage?.url ? (
              <img
                src={singleSession?.session_booking_user?.profileImage.url}
                alt="Profile"
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {singleSession?.patient_details?.name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 capitalize">
              {singleSession?.session_booking_user?.role}
            </p>
            <Badge className="mt-1 bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 text-xs font-medium">
              {singleSession?.session_booking_user?.status}
            </Badge>
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-800" />

        {/* Contact Section */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {singleSession?.patient_details?.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {singleSession?.patient_details?.phone}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Payment Information */}
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <CreditCard className="w-5 h-5 text-green-600 dark:text-green-500" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
            <p className="font-medium text-gray-900 dark:text-gray-200 capitalize">
              {singleSession?.payment_id?.paymentMethod}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Payment Status</p>
            <Badge
              className={cn(
                "mt-1 px-2.5 py-1 text-xs font-medium",
                singleSession?.payment_id?.status === "pending"
                  ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                  : singleSession?.payment_id?.status === "success"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
              )}
            >
              {singleSession?.payment_id?.status}
            </Badge>
          </div>
        </div>

        <Separator className="bg-gray-200 dark:bg-gray-800" />

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
            <span className="text-gray-900 dark:text-gray-200">
              {formatCurrency(
                Number.parseInt(singleSession?.payment_id?.payment_details?.subtotal || "0")
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Tax</span>
            <span className="text-gray-900 dark:text-gray-200">
              {formatCurrency(
                Number.parseInt(singleSession?.payment_id?.payment_details?.tax || "0")
              )}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Credit Card Fee</span>
            <span className="text-gray-900 dark:text-gray-200">
              {formatCurrency(
                Number.parseInt(singleSession?.payment_id?.payment_details?.creditCardFee || "0")
              )}
            </span>
          </div>

          <Separator className="bg-gray-200 dark:bg-gray-800" />

          <div className="flex justify-between font-bold text-lg pt-1">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-green-600 dark:text-green-500">
              {formatCurrency(singleSession?.payment_id?.amount)}
            </span>
          </div>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mt-2">
          <p>Order ID: {singleSession?.payment_id?.razorpay_order_id || "—"}</p>
          <p>
            Paid on:{" "}
            {singleSession?.payment_id?.paidAt
              ? format(new Date(singleSession.payment_id.paidAt), "PPp")
              : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  </div>
</TabsContent>


 <TabsContent value="treatment" className="space-y-6">
  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
        <Activity className="w-5 h-5 text-green-600 dark:text-green-500" />
        Treatment Details
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Treatment Info */}
        <div className="space-y-5">
          <div>
            <h3 className="font-semibold text-2xl text-gray-900 dark:text-white">
              {singleSession?.treatment_id?.service_name}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
              {singleSession?.treatment_id?.service_small_desc}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-2xl font-bold text-green-600 dark:text-green-500">
              {formatCurrency(singleSession?.treatment_id?.service_per_session_discount_price)}
            </div>
            <div className="text-lg text-gray-400 dark:text-gray-500 line-through">
              {formatCurrency(singleSession?.treatment_id?.service_per_session_price)}
            </div>
            <Badge className="bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 font-semibold px-3 py-1">
              {singleSession?.treatment_id?.service_per_session_discount_percentage}% OFF
            </Badge>
          </div>

          <Badge
            className={cn(
              "w-fit px-3 py-1 font-medium",
              singleSession?.treatment_id?.service_status === "Booking Open"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
            )}
          >
            {singleSession?.treatment_id?.service_status}
          </Badge>
        </div>

        {/* Treatment Images */}
        <div>
          {singleSession?.treatment_id?.service_images?.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {singleSession?.treatment_id?.service_images
                .slice(0, 4)
                .map((image, index) => (
                  <div
                    key={image._id}
                    className="overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <img
                      src={image.url || "/placeholder.svg"}
                      alt={`Treatment image ${index + 1}`}
                      className="w-full h-32 lg:h-40 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    {/* Clinic Information */}
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-semibold">
          <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-500" />
          Clinic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
            {singleSession?.session_booking_for_clinic?.clinic_name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {singleSession?.session_booking_for_clinic?.clinic_ratings}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
              <p className="text-sm">
                {singleSession?.session_booking_for_clinic?.clinic_contact_details?.clinic_address}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Timings</p>
              <p className="text-sm">
                {singleSession?.session_booking_for_clinic?.clinic_timings?.open_time} –{" "}
                {singleSession?.session_booking_for_clinic?.clinic_timings?.close_time}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Closed on {singleSession?.session_booking_for_clinic?.clinic_timings?.off_day}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-1" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
              {singleSession?.session_booking_for_clinic?.clinic_contact_details?.phone_numbers?.map(
                (phone, index) => (
                  <p key={index} className="text-sm">
                    {phone}
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        {singleSession?.session_booking_for_clinic?.any_special_note && (
          <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border-l-4 border-blue-300 dark:border-blue-700">
            {singleSession.session_booking_for_clinic.any_special_note}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Doctor Information */}
    <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg hover:shadow-xl transition-shadow duration-300 rounded-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white text-lg font-semibold">
          <Stethoscope className="w-5 h-5 text-purple-600 dark:text-purple-500" />
          Doctor Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="font-semibold text-xl text-gray-900 dark:text-white">
            {singleSession?.session_booking_for_doctor?.doctor_name}
          </h3>
          <div className="flex items-center flex-wrap gap-2 mt-1.5">
            <Star className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {singleSession?.session_booking_for_doctor?.doctor_ratings}
            </span>
            <Badge
              className={cn(
                "ml-1 px-3 py-1 text-xs font-medium",
                singleSession?.session_booking_for_doctor?.doctor_status === "Active"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
              )}
            >
              {singleSession?.session_booking_for_doctor?.doctor_status}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 text-gray-700 dark:text-gray-300">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {singleSession?.session_booking_for_doctor?.specialization?.map((spec, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-3 py-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1.5">Languages</p>
            <div className="flex flex-wrap gap-2">
              {singleSession?.session_booking_for_doctor?.languagesSpoken?.map((lang, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                >
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {singleSession?.session_booking_for_doctor?.any_special_note && (
          <div className="text-sm text-gray-700 dark:text-gray-300 p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border-l-4 border-purple-300 dark:border-purple-700">
            {singleSession.session_booking_for_doctor.any_special_note}
          </div>
        )}
      </CardContent>
    </Card>
  </div>
</TabsContent>

<TabsContent value="sessions" className="space-y-6">
  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
    <CardHeader>
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <CalendarCheck className="w-5 h-5 text-purple-600 dark:text-purple-500" />
            Session Timeline
          </CardTitle>
          <CardDescription className="text-gray-500 dark:text-gray-400">
            Track all scheduled sessions and their status
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="bg-teal-600 hover:bg-teal-700 text-white border-none focus:ring-4 focus:ring-teal-500/40 font-medium rounded transition flex items-center"
          onClick={() => setRescheduleDialog(true)}
          disabled={loading}
        >
          <Edit className="w-4 h-4 mr-2" />
          Reschedule
        </Button>
      </div>
    </CardHeader>

    <CardContent className="space-y-5">
      <div className="space-y-4">
        {singleSession?.SessionDates?.map((session, index) => (
          <div
            key={session._id}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors"
          >
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                  {session.sessionNumber}
                </span>
              </div>
            </div>

            <div className="flex-1 w-full">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Session {session.sessionNumber}
                </h4>
                {getStatusBadge(session.status)}
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {format(new Date(session.date), "PPP")}
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {session.time}
                </div>
              </div>

              {session.status === "Completed" && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2.5">
                    <FileText className="w-4 h-4 text-green-600 dark:text-green-500" />
                    <span className="text-sm font-medium text-green-800 dark:text-green-300">
                      Session Prescriptions
                    </span>
                  </div>

                  {singleSession?.session_prescriptions?.filter(
                    (p) => p.sessionNumber === session.sessionNumber
                  ).length > 0 ? (
                    <div className="space-y-2">
                      {singleSession?.session_prescriptions
                        ?.filter((p) => p.sessionNumber === session.sessionNumber)
                        ?.map((prescription, pIndex) => (
                          <div
                            key={pIndex}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <span className="text-green-700 dark:text-green-300 font-medium">
                              {prescription.prescriptionType}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow rounded px-3 h-8 flex items-center transition-all"
                                onClick={() => (window.location.href = prescription?.url)}
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" /> View
                              </Button>

                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-sm hover:shadow rounded px-3 h-8 flex items-center transition-all"
                                onClick={() =>
                                  fetch(prescription?.url)
                                    .then((res) => res.blob())
                                    .then((blob) => {
                                      const link = document.createElement("a");
                                      link.href = URL.createObjectURL(blob);
                                      link.download = `Prescription-${prescription?.sessionNumber}.pdf`;
                                      link.click();
                                      URL.revokeObjectURL(link.href);
                                    })
                                    .catch((err) => console.error("Download failed", err))
                                }
                              >
                                <Download className="w-3.5 h-3.5 mr-1" /> Download
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-green-600 dark:text-green-400 italic">
                      No prescriptions added yet
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3 sm:mt-0">
              {(session.status === "Pending" || session.status === "Confirmed") && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white rounded shadow-sm focus:ring-2 focus:ring-green-400/50 transition"
                    onClick={() =>
                      updateSessionStatus({
                        sessionNumber: session.sessionNumber,
                        status: "Completed",
                      })
                    }
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Complete
                  </Button>

                  <Button
                    size="sm"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white rounded shadow-sm focus:ring-2 focus:ring-yellow-400/50 transition"
                    onClick={() =>
                      updateSessionStatus({
                        sessionNumber: session.sessionNumber,
                        status: "Cancelled",
                      })
                    }
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancel
                  </Button>

                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white rounded shadow-sm focus:ring-2 focus:ring-red-400/50 transition"
                    onClick={() =>
                      updateSessionStatus({
                        sessionNumber: session.sessionNumber,
                        status: "No-Show",
                      })
                    }
                    disabled={loading}
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    No-Show
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {singleSession?.nextSession && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-lg">
          <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2.5">
            Next Session
          </h4>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              {format(new Date(singleSession?.nextSession.date), "PPP")}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {singleSession?.nextSession.time}
            </div>
            {getStatusBadge(singleSession?.nextSession.status)}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
       <TabsContent value="prescriptions" className="space-y-6">
  <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-md rounded-xl">
    <CardHeader>
      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
        <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
        Session Prescriptions
      </CardTitle>
      <CardDescription className="text-gray-500 dark:text-gray-400">
        Manage prescriptions for each session
      </CardDescription>
    </CardHeader>

    <CardContent className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-5">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {singleSession?.session_prescriptions?.length || 0} prescription(s) available
        </p>

        <Dialog open={prescriptionDialog} onOpenChange={setPrescriptionDialog}>
          <DialogTrigger asChild>
            <Button
              size="sm"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700 text-white border-none focus:ring-4 focus:ring-teal-500/40 font-medium rounded transition flex items-center shadow-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Prescription
            </Button>
          </DialogTrigger>

          <DialogContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Add Prescription</DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Upload a prescription for a specific session.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Prescription Type */}
              <div>
                <Label htmlFor="prescriptionType" className="font-semibold text-gray-700 dark:text-gray-300">
                  Prescription Type
                </Label>
                <Select value={prescriptionType} onValueChange={setPrescriptionType}>
                  <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <SelectValue placeholder="Select prescription type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200">
                    {prescriptionTypes.map((type) => (
                      <SelectItem
                        key={type}
                        value={type}
                        className="focus:bg-teal-50 dark:focus:bg-teal-950/40 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                      >
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Session Number */}
              <div>
                <Label htmlFor="sessionNumber" className="font-semibold text-gray-700 dark:text-gray-300">
                  Session Number
                </Label>
                <Select
                  value={selectedSessionNumber.toString()}
                  onValueChange={(value) => setSelectedSessionNumber(Number.parseInt(value))}
                >
                  <SelectTrigger className="mt-1.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                    <SelectValue placeholder="Select session" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200">
                    {Array.from({ length: singleSession?.no_of_session_book || 0 }, (_, i) => (
                      <SelectItem
                        key={i + 1}
                        value={(i + 1).toString()}
                        className="focus:bg-teal-50 dark:focus:bg-teal-950/40 hover:bg-teal-50 dark:hover:bg-teal-950/30"
                      >
                        Session {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div>
                <Label htmlFor="prescription-file" className="font-semibold text-gray-700 dark:text-gray-300">
                  Upload File
                </Label>
                <Input
                  id="prescription-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setPrescriptionFile(e.target.files?.[0] || null)}
                  className="mt-1.5 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-200 file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-700 dark:file:text-gray-300 file:border-0 file:mr-4 file:py-2 file:px-4 hover:file:bg-gray-200 dark:hover:file:bg-gray-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 rounded-lg"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                  Supported formats: PDF, Image (JPG, PNG, etc.)
                </p>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => setPrescriptionDialog(false)}
                className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPrescription}
                disabled={!prescriptionType || loading}
                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-md focus:ring-4 focus:ring-teal-500/40 disabled:opacity-60 disabled:cursor-not-allowed flex items-center"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add Prescription
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* No prescriptions state */}
      {(!singleSession?.session_prescriptions || singleSession?.session_prescriptions.length === 0) ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
          <p className="font-medium">No prescriptions available yet.</p>
          <p className="text-sm mt-1">
            Add prescriptions using the button above.
          </p>
        </div>
      ) : (
        /* List of prescriptions */
        <div className="space-y-3">
          {singleSession?.session_prescriptions.map((prescription, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/40 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <FileText className="w-5 h-5 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {prescription.prescriptionType}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Session {prescription.sessionNumber}
                  </p>
                  {prescription.createdAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                      Added on {format(new Date(prescription.createdAt), "PPp")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-none shadow-sm hover:shadow focus:ring-2 focus:ring-blue-400/50 h-8 px-3"
                  onClick={() => (window.location.href = prescription?.url)}
                >
                  <Eye className="w-3.5 h-3.5 mr-1.5" />
                  View
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white border-none shadow-sm hover:shadow focus:ring-2 focus:ring-green-400/50 h-8 px-3"
                  onClick={() =>
                    fetch(prescription?.url)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const link = document.createElement("a");
                        link.href = URL.createObjectURL(blob);
                        link.download = `Prescription-${prescription?.sessionNumber}.pdf`;
                        link.click();
                        URL.revokeObjectURL(link.href);
                      })
                      .catch((err) => console.error("Download failed", err))
                  }
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
</TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SessionDetails;
