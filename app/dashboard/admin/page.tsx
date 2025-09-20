"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Shield,
  Package,
  ShoppingCart,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Download,
  FileText,
  CalendarIcon,
  RefreshCw,
  MessageSquare,
} from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"

// Mock data
const mockVerifications = [
  {
    id: "1",
    user: {
      name: "Sarah Chen",
      email: "sarah@example.com",
      role: "supplier",
      avatar: "/fashion-influencer-avatar.png",
    },
    type: "identity",
    status: "pending",
    documents: ["passport.pdf", "business_license.pdf"],
    submittedAt: "2024-01-20T10:30:00Z",
    notes: "Initial verification submission",
  },
  {
    id: "2",
    user: { name: "Alex Kim", email: "alex@example.com", role: "influencer", avatar: "/brand-manager-avatar.png" },
    type: "social_media",
    status: "pending",
    documents: ["instagram_verification.png"],
    submittedAt: "2024-01-19T15:45:00Z",
    notes: "Instagram account verification",
  },
]

const mockOrders = [
  {
    id: "ORD-001",
    customer: "Emma Wilson",
    influencer: "Sarah Chen",
    total: 245.99,
    status: "completed",
    items: 3,
    createdAt: "2024-01-20T14:30:00Z",
    refundable: true,
  },
  {
    id: "ORD-002",
    customer: "Mike Johnson",
    influencer: "Alex Kim",
    total: 89.5,
    status: "processing",
    items: 1,
    createdAt: "2024-01-20T12:15:00Z",
    refundable: false,
  },
]

const mockCommissions = [
  {
    id: "1",
    influencer: "Sarah Chen",
    order: "ORD-001",
    amount: 49.2,
    rate: 20,
    status: "paid",
    paidAt: "2024-01-20T16:00:00Z",
  },
  {
    id: "2",
    influencer: "Alex Kim",
    order: "ORD-002",
    amount: 17.9,
    rate: 20,
    status: "pending",
    paidAt: null,
  },
]

const mockDisputes = [
  {
    id: "DSP-001",
    order: "ORD-001",
    customer: "Emma Wilson",
    reason: "Product not as described",
    status: "open",
    priority: "high",
    createdAt: "2024-01-21T09:00:00Z",
    messages: 3,
  },
]

export default function AdminConsole() {
  const [activeTab, setActiveTab] = useState("verifications")
  const [selectedVerification, setSelectedVerification] = useState<any>(null)
  const [verificationNote, setVerificationNote] = useState("")
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined)
  const [selectedInfluencer, setSelectedInfluencer] = useState("all")

  const handleApproveVerification = async (id: string) => {
    // Mock API call
    console.log("[v0] Approving verification:", id, "with note:", verificationNote)
    setSelectedVerification(null)
    setVerificationNote("")
  }

  const handleRejectVerification = async (id: string) => {
    // Mock API call
    console.log("[v0] Rejecting verification:", id, "with note:", verificationNote)
    setSelectedVerification(null)
    setVerificationNote("")
  }

  const handleRefundOrder = async (orderId: string) => {
    // Mock API call
    console.log("[v0] Processing refund for order:", orderId)
  }

  const handleExportCommissions = () => {
    // Mock CSV export
    console.log("[v0] Exporting commissions CSV")
  }

  const getStatusBadge = (status: string, type: "verification" | "order" | "commission" | "dispute") => {
    const variants: Record<string, any> = {
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      completed: "default",
      processing: "secondary",
      paid: "default",
      open: "destructive",
      closed: "secondary",
    }

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Console</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage platform operations and user activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pending Verifications</p>
                <p className="text-2xl font-bold text-amber-600">2</p>
              </div>
              <Shield className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Active Products</p>
                <p className="text-2xl font-bold text-indigo-600">1,247</p>
              </div>
              <Package className="h-8 w-8 text-indigo-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Orders Today</p>
                <p className="text-2xl font-bold text-green-600">23</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Open Disputes</p>
                <p className="text-2xl font-bold text-red-600">1</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="verifications">Verifications</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="commissions">Commissions</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
        </TabsList>

        {/* Verifications Tab */}
        <TabsContent value="verifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>User Verifications</CardTitle>
                <div className="flex gap-2">
                  <Select defaultValue="all">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="supplier">Suppliers</SelectItem>
                      <SelectItem value="influencer">Influencers</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="pending">
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVerifications.map((verification) => (
                    <TableRow key={verification.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={verification.user.avatar || "/placeholder.svg"}
                            alt={verification.user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{verification.user.name}</p>
                            <p className="text-sm text-gray-500">{verification.user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {verification.type.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(verification.status, "verification")}</TableCell>
                      <TableCell>{format(new Date(verification.submittedAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <Sheet>
                          <SheetTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedVerification(verification)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </SheetTrigger>
                          <SheetContent className="w-[400px] sm:w-[540px]">
                            <SheetHeader>
                              <SheetTitle>Verification Details</SheetTitle>
                            </SheetHeader>
                            {selectedVerification && (
                              <div className="space-y-6 mt-6">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={selectedVerification.user.avatar || "/placeholder.svg"}
                                    alt={selectedVerification.user.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                  />
                                  <div>
                                    <h3 className="font-semibold">{selectedVerification.user.name}</h3>
                                    <p className="text-sm text-gray-500">{selectedVerification.user.email}</p>
                                    <Badge variant="outline" className="mt-1 capitalize">
                                      {selectedVerification.user.role}
                                    </Badge>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-medium mb-2">Documents</h4>
                                  <div className="space-y-2">
                                    {selectedVerification.documents.map((doc: string, index: number) => (
                                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">{doc}</span>
                                        <Button variant="ghost" size="sm" className="ml-auto">
                                          <Eye className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div>
                                  <label className="text-sm font-medium mb-2 block">Admin Note</label>
                                  <Textarea
                                    placeholder="Add a note about this verification..."
                                    value={verificationNote}
                                    onChange={(e) => setVerificationNote(e.target.value)}
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                    onClick={() => handleApproveVerification(selectedVerification.id)}
                                  >
                                    <Check className="h-4 w-4 mr-2" />
                                    Approve
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => handleRejectVerification(selectedVerification.id)}
                                  >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </SheetContent>
                        </Sheet>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Product Management</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search products..." className="pl-10 w-64" />
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">Global: 456</Badge>
                  <Badge variant="outline">KR: 234</Badge>
                  <Badge variant="outline">JP: 189</Badge>
                  <Badge variant="outline">CN: 368</Badge>
                </div>
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Product management interface would be implemented here</p>
                  <p className="text-sm">Search, filter, and bulk deactivate products</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Order Management</CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono">{order.id}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{order.influencer}</TableCell>
                      <TableCell>${order.total}</TableCell>
                      <TableCell>{getStatusBadge(order.status, "order")}</TableCell>
                      <TableCell>{format(new Date(order.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader>
                                <SheetTitle>Order Details - {order.id}</SheetTitle>
                              </SheetHeader>
                              <div className="space-y-4 mt-6">
                                <div>
                                  <h4 className="font-medium mb-2">Order Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Customer:</span>
                                      <span>{order.customer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Influencer:</span>
                                      <span>{order.influencer}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Items:</span>
                                      <span>{order.items}</span>
                                    </div>
                                    <div className="flex justify-between font-medium">
                                      <span>Total:</span>
                                      <span>${order.total}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </SheetContent>
                          </Sheet>
                          {order.refundable && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-600">
                                  Refund
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Process Refund</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to process a full refund for order {order.id}? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleRefundOrder(order.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Process Refund
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commissions Tab */}
        <TabsContent value="commissions" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Commission Ledger</CardTitle>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        Date Range
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar mode="range" selected={dateRange} onSelect={setDateRange} numberOfMonths={2} />
                    </PopoverContent>
                  </Popover>
                  <Select value={selectedInfluencer} onValueChange={setSelectedInfluencer}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Influencers</SelectItem>
                      <SelectItem value="sarah">Sarah Chen</SelectItem>
                      <SelectItem value="alex">Alex Kim</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleExportCommissions} className="bg-amber-600 hover:bg-amber-700">
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Influencer</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Paid Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCommissions.map((commission) => (
                    <TableRow key={commission.id}>
                      <TableCell>{commission.influencer}</TableCell>
                      <TableCell className="font-mono">{commission.order}</TableCell>
                      <TableCell>{commission.rate}%</TableCell>
                      <TableCell className="font-medium">${commission.amount}</TableCell>
                      <TableCell>{getStatusBadge(commission.status, "commission")}</TableCell>
                      <TableCell>
                        {commission.paidAt ? format(new Date(commission.paidAt), "MMM d, yyyy") : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Disputes Tab */}
        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dispute Management</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDisputes.map((dispute) => (
                    <TableRow key={dispute.id}>
                      <TableCell className="font-mono">{dispute.id}</TableCell>
                      <TableCell className="font-mono">{dispute.order}</TableCell>
                      <TableCell>{dispute.customer}</TableCell>
                      <TableCell>{dispute.reason}</TableCell>
                      <TableCell>
                        <Badge variant={dispute.priority === "high" ? "destructive" : "secondary"}>
                          {dispute.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(dispute.status, "dispute")}</TableCell>
                      <TableCell>{format(new Date(dispute.createdAt), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Select defaultValue={dispute.status}>
                            <SelectTrigger className="w-24 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="investigating">Investigating</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
