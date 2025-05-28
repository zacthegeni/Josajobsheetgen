"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { Clipboard, FileText, Info, Upload, Check, Eye, Github } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

// These are the exact coordinates from your Python application
const FIELD_POSITIONS = {
  customerName: { x: 176.4, y: 192.24 },
  sordNumber: { x: 381.6, y: 192.24 },
  customerAddress: { x: 176.4, y: 213.96 },
  phone: { x: 176.4, y: 233.28 },
  email: { x: 375.12, y: 233.28 },
  wkNumber: { x: 381.6, y: 170.76 },
  products: { x: 59.4, y: 331.2, spacing: 19 }, // Starting Y and spacing between products
}

// Template filename
const TEMPLATE_FILENAME = "NEW JOB SHEET - 2024.pdf"

export default function JobSheetFiller() {
  const [inputData, setInputData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pdfTemplate, setPdfTemplate] = useState<ArrayBuffer | null>(null)
  const [pdfTemplateUploaded, setPdfTemplateUploaded] = useState(false)
  const [useGeneratedTemplate, setUseGeneratedTemplate] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [generatingTemplate, setGeneratingTemplate] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewUrl, setPreviewUrl] = useState("")
  const [loadingGithubTemplate, setLoadingGithubTemplate] = useState(false)

  // Try to fetch template on component mount
  useEffect(() => {
    fetchTemplateFromSameRepo()
  }, [])

  const fetchTemplateFromSameRepo = async () => {
    setLoadingGithubTemplate(true)
    setError("")

    try {
      // When hosted on GitHub Pages, we can load the PDF from the same repository
      // The path is relative to the base URL of the deployed site
      const templatePath = `/${TEMPLATE_FILENAME}`

      console.log(`Trying to fetch template from: ${templatePath}`)
      const response = await fetch(templatePath)

      if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`)
      }

      const templateBuffer = await response.arrayBuffer()
      setPdfTemplate(templateBuffer)
      setPdfTemplateUploaded(true)
      setUseGeneratedTemplate(false)
      console.log("Template loaded successfully")
    } catch (err) {
      console.error("Error loading template:", err)
      setError(`Template not available. Using generated template instead.`)
      // Fallback to generated template
      await generateBlankTemplate()
    } finally {
      setLoadingGithubTemplate(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputData(e.target.value)
    setError("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        setPdfTemplate(event.target.result)
        setPdfTemplateUploaded(true)
        setUseGeneratedTemplate(false)
        setError("")
      } else {
        setError("Failed to read the PDF file")
      }
    }
    reader.onerror = () => {
      setError("Failed to read the PDF file")
    }
    reader.readAsArrayBuffer(file)
  }

  const generateBlankTemplate = async () => {
    setGeneratingTemplate(true)
    setError("")

    try {
      const pdfDoc = await PDFDocument.create()
      const page = pdfDoc.addPage([595, 842]) // A4 size
      const { width, height } = page.getSize()

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

      // Title
      page.drawText("I understand by signing this form that I am satisfied with the job completed on my equipment", {
        x: 50,
        y: height - 50,
        size: 10,
        font: helveticaFont,
      })

      // Header
      page.drawText("SERVICE - REPAIRS - INSTALLATIONS & DELIVERY", {
        x: 150,
        y: height - 80,
        size: 12,
        font: helveticaBold,
      })

      // Installer Data section
      page.drawText("Installer Data", {
        x: 50,
        y: height - 110,
        size: 11,
        font: helveticaBold,
      })

      // Form fields with underlines
      // Row 1
      page.drawText("Install Date", {
        x: 50,
        y: height - 130,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 120, y: height - 135 },
        end: { x: 250, y: height - 135 },
        thickness: 0.5,
      })

      page.drawText("WK REF (Web Sale Only)", {
        x: 300,
        y: height - 130,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 440, y: height - 135 },
        end: { x: 550, y: height - 135 },
        thickness: 0.5,
      })

      // Row 2
      page.drawText("Customer Name", {
        x: 50,
        y: height - 155,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 140, y: height - 160 },
        end: { x: 250, y: height - 160 },
        thickness: 0.5,
      })

      page.drawText("SORD NUMBER", {
        x: 300,
        y: height - 155,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 390, y: height - 160 },
        end: { x: 550, y: height - 160 },
        thickness: 0.5,
      })

      // Row 3
      page.drawText("Customers Address", {
        x: 50,
        y: height - 180,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 150, y: height - 185 },
        end: { x: 550, y: height - 185 },
        thickness: 0.5,
      })

      // Row 4
      page.drawText("Phone Number", {
        x: 50,
        y: height - 205,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 130, y: height - 210 },
        end: { x: 250, y: height - 210 },
        thickness: 0.5,
      })

      page.drawText("Email Address", {
        x: 300,
        y: height - 205,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 380, y: height - 210 },
        end: { x: 550, y: height - 210 },
        thickness: 0.5,
      })

      // Row 5
      page.drawText("Install Date:", {
        x: 50,
        y: height - 230,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 120, y: height - 235 },
        end: { x: 250, y: height - 235 },
        thickness: 0.5,
      })

      page.drawText("Install Operative:", {
        x: 300,
        y: height - 230,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 400, y: height - 235 },
        end: { x: 550, y: height - 235 },
        thickness: 0.5,
      })

      // Row 6
      page.drawText("Time In:", {
        x: 50,
        y: height - 255,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 100, y: height - 260 },
        end: { x: 250, y: height - 260 },
        thickness: 0.5,
      })

      page.drawText("Time Out:", {
        x: 300,
        y: height - 255,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 360, y: height - 260 },
        end: { x: 550, y: height - 260 },
        thickness: 0.5,
      })

      // Data section
      page.drawText("Data Below", {
        x: 50,
        y: height - 285,
        size: 11,
        font: helveticaBold,
      })

      page.drawText("MODEL / PRODUCT BRAND", {
        x: 50,
        y: height - 305,
        size: 10,
        font: helveticaFont,
      })

      page.drawText("Serial Number (FILLED BY THE INSTALLERS)", {
        x: 300,
        y: height - 305,
        size: 10,
        font: helveticaFont,
      })

      // Product lines
      for (let i = 0; i < 10; i++) {
        const y = height - 325 - i * 20
        page.drawLine({
          start: { x: 50, y },
          end: { x: 280, y },
          thickness: 0.5,
        })
        page.drawLine({
          start: { x: 300, y },
          end: { x: 550, y },
          thickness: 0.5,
        })
      }

      // Signature section
      page.drawText("Customer Signature", {
        x: 50,
        y: height - 550,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 50, y: height - 570 },
        end: { x: 250, y: height - 570 },
        thickness: 0.5,
      })

      page.drawText("Installers Signature", {
        x: 300,
        y: height - 550,
        size: 10,
        font: helveticaFont,
      })
      page.drawLine({
        start: { x: 300, y: height - 570 },
        end: { x: 550, y: height - 570 },
        thickness: 0.5,
      })

      // Notes section
      page.drawText("Installers Notes if Required:", {
        x: 50,
        y: height - 600,
        size: 10,
        font: helveticaFont,
      })

      // Footer
      page.drawText("FITSHOP UK", {
        x: 50,
        y: height - 700,
        size: 10,
        font: helveticaBold,
      })

      page.drawText("3 Rutherglen links Business Park", {
        x: 50,
        y: height - 715,
        size: 9,
        font: helveticaFont,
      })

      page.drawText("Farmload Road", {
        x: 50,
        y: height - 730,
        size: 9,
        font: helveticaFont,
      })

      page.drawText("Glasgow", {
        x: 50,
        y: height - 745,
        size: 9,
        font: helveticaFont,
      })

      page.drawText("G73 1DF", {
        x: 50,
        y: height - 760,
        size: 9,
        font: helveticaFont,
      })

      page.drawText("Tel: 0141 737 2249", {
        x: 50,
        y: height - 775,
        size: 9,
        font: helveticaFont,
      })

      const pdfBytes = await pdfDoc.save()
      setPdfTemplate(pdfBytes)
      setPdfTemplateUploaded(true)
      setUseGeneratedTemplate(true)
      setError("")
    } catch (err) {
      console.error("Error generating template:", err)
      setPdfTemplateUploaded(false)
      setError(`Failed to generate template. ${err instanceof Error ? err.message : ""}`)
    } finally {
      setGeneratingTemplate(false)
    }
  }

  const toggleGeneratedTemplate = (value: boolean) => {
    setUseGeneratedTemplate(value)
    if (value) {
      generateBlankTemplate()
    } else {
      // If turning off generated template, try to fetch from repo again
      fetchTemplateFromSameRepo()
    }
  }

  const generatePDF = async (preview = false) => {
    if (preview) {
      setShowPreview(false)
    } else {
      setLoading(true)
    }
    setError("")
    setSuccess(false)

    try {
      if (!pdfTemplate) {
        throw new Error("Please upload or generate a PDF template first")
      }

      const lines = inputData
        .trim()
        .split("\n")
        .filter((line) => line.trim() !== "")

      if (lines.length < 6) {
        throw new Error("Please provide at least customer name, address, phone, email, one product, and SORD number")
      }

      // Parse data exactly like the Python app
      let wkNumber = ""
      let sordNumber = ""
      let productLines = []

      // Check if last line is WK number
      if (lines[lines.length - 1].trim().toLowerCase().startsWith("wk")) {
        wkNumber = lines[lines.length - 1].trim()
        sordNumber = lines[lines.length - 2].trim()
        productLines = lines.slice(4, lines.length - 2)
      } else {
        sordNumber = lines[lines.length - 1].trim()
        productLines = lines.slice(4, lines.length - 1)
      }

      const customerName = lines[0].trim()
      const customerAddress = lines[1].trim()
      const phone = lines[2].trim()
      const email = lines[3].trim()

      if (!customerName || !sordNumber) {
        throw new Error("Customer name and SORD number are required")
      }

      // Load and fill the PDF
      const pdfDoc = await PDFDocument.load(pdfTemplate)
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
      const page = pdfDoc.getPages()[0]
      const { height } = page.getSize()

      // Convert from PyMuPDF coordinates to PDF-lib coordinates
      // In PyMuPDF, (0,0) is top-left, in PDF-lib (0,0) is bottom-left
      const convertY = (y: number) => height - y

      // Fill in the form fields using the exact coordinates from the Python app
      // Customer Name
      page.drawText(customerName, {
        x: FIELD_POSITIONS.customerName.x,
        y: convertY(FIELD_POSITIONS.customerName.y),
        size: 10,
        font: helveticaFont,
      })

      // SORD NUMBER
      page.drawText(sordNumber, {
        x: FIELD_POSITIONS.sordNumber.x,
        y: convertY(FIELD_POSITIONS.sordNumber.y),
        size: 10,
        font: helveticaFont,
      })

      // Customer Address
      page.drawText(customerAddress, {
        x: FIELD_POSITIONS.customerAddress.x,
        y: convertY(FIELD_POSITIONS.customerAddress.y),
        size: 10,
        font: helveticaFont,
      })

      // Phone Number
      page.drawText(phone, {
        x: FIELD_POSITIONS.phone.x,
        y: convertY(FIELD_POSITIONS.phone.y),
        size: 10,
        font: helveticaFont,
      })

      // Email Address
      page.drawText(email, {
        x: FIELD_POSITIONS.email.x,
        y: convertY(FIELD_POSITIONS.email.y),
        size: 8, // Note: Python code uses size 8 for email
        font: helveticaFont,
      })

      // WK Number (if provided)
      if (wkNumber) {
        page.drawText(wkNumber, {
          x: FIELD_POSITIONS.wkNumber.x,
          y: convertY(FIELD_POSITIONS.wkNumber.y),
          size: 10,
          font: helveticaFont,
        })
      }

      // Products section
      productLines.forEach((product, index) => {
        const y = FIELD_POSITIONS.products.y + index * FIELD_POSITIONS.products.spacing
        page.drawText(product, {
          x: FIELD_POSITIONS.products.x,
          y: convertY(y),
          size: 8, // Note: Python code uses size 8 for products
          font: helveticaFont,
        })
      })

      // Save the PDF
      const filledPdfBytes = await pdfDoc.save()

      if (preview) {
        // For preview, create a data URL
        const blob = new Blob([filledPdfBytes], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setShowPreview(true)
      } else {
        // For download
        const blob = new Blob([filledPdfBytes], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `${customerName.replace(/[/\\]/g, "-")} ${sordNumber} Installation Worksheet.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setSuccess(true)
        // Clear input for next entry
        setInputData("")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      if (!preview) {
        setLoading(false)
      }
    }
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img
              src="/placeholder.svg?height=100&width=200&query=Josa%20Solutions%20Logo"
              alt="Josa Solutions Logo"
              className="h-20 object-contain"
            />
          </div>
          <CardTitle className="text-xl">Josa Solutions - Installation Worksheet Filler</CardTitle>
          <CardDescription>Fill job sheets by pasting data and generating PDFs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="input">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="template">Template</TabsTrigger>
            </TabsList>
            <TabsContent value="input">
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                  <p className="font-medium mb-1">Paste data in this order:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Customer Name</li>
                    <li>Address (ONE line only)</li>
                    <li>Phone</li>
                    <li>Email</li>
                    <li>Products (1-10 lines)</li>
                    <li>SORD Number</li>
                    <li>WK Number (optional, must start with 'WK')</li>
                  </ol>
                </div>

                <Textarea
                  placeholder="Paste your data here..."
                  rows={12}
                  value={inputData}
                  onChange={handleInputChange}
                  className="font-mono text-sm"
                />

                {error && (
                  <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <FileText className="h-4 w-4" />
                    <AlertTitle>Success</AlertTitle>
                    <AlertDescription>PDF generated successfully! Check your downloads folder.</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => generatePDF(true)}
                    disabled={!inputData.trim() || !pdfTemplateUploaded}
                    variant="outline"
                    className="flex-1"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    onClick={() => generatePDF(false)}
                    disabled={loading || !inputData.trim() || !pdfTemplateUploaded}
                    className="flex-1"
                  >
                    {loading ? "Generating..." : "Generate PDF"}
                  </Button>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard
                      .readText()
                      .then((text) => {
                        setInputData(text)
                        setError("")
                      })
                      .catch(() => {
                        setError("Failed to paste from clipboard. Please paste manually.")
                      })
                  }}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  Paste from Clipboard
                </Button>

                {showPreview && (
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Preview</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowPreview(false)
                          URL.revokeObjectURL(previewUrl)
                        }}
                      >
                        Close
                      </Button>
                    </div>
                    <div className="border rounded overflow-hidden" style={{ height: "500px" }}>
                      <iframe src={previewUrl} width="100%" height="100%" title="PDF Preview"></iframe>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="template">
              <div className="space-y-4">
                {/* Repository Template */}
                <div className="border rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <Github className="h-5 w-5 mr-2 text-gray-500" />
                    <h3 className="font-medium">Repository Template</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Load the template from this repository</p>
                  <Button
                    variant="outline"
                    onClick={fetchTemplateFromSameRepo}
                    disabled={loadingGithubTemplate}
                    className="w-full"
                  >
                    {loadingGithubTemplate ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                        Loading...
                      </>
                    ) : pdfTemplateUploaded && !useGeneratedTemplate ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Template Loaded
                      </>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        Load from Repository
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">File: {TEMPLATE_FILENAME}</p>
                </div>

                <div className="grid gap-4">
                  {/* Option 1: Upload Template */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Upload className="h-5 w-5 mr-2 text-gray-500" />
                      <h3 className="font-medium">Upload Template</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Upload your own PDF template file</p>
                    <div className="flex items-center gap-2">
                      <input
                        id="pdf-upload"
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        ref={fileInputRef}
                      />
                      <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                        {pdfTemplateUploaded && !useGeneratedTemplate ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Template Uploaded
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload PDF Template
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Option 2: Generate Template */}
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <FileText className="h-5 w-5 mr-2 text-gray-500" />
                      <h3 className="font-medium">Generate Template</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      Create a blank job sheet template automatically
                    </p>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="generate-template"
                        checked={useGeneratedTemplate}
                        onCheckedChange={toggleGeneratedTemplate}
                      />
                      <Label htmlFor="generate-template" className="cursor-pointer">
                        Use generated template
                      </Label>
                    </div>

                    {generatingTemplate && (
                      <div className="flex items-center justify-center p-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Generating template...</span>
                      </div>
                    )}

                    {useGeneratedTemplate && pdfTemplateUploaded && !generatingTemplate && (
                      <Alert className="bg-green-50 text-green-800 border-green-200 mt-3">
                        <Check className="h-4 w-4" />
                        <AlertTitle>Template Ready</AlertTitle>
                        <AlertDescription>Template generated successfully!</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t">
                  <h3 className="font-medium mb-2">Example Input</h3>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                    Josa Solutions{"\n"}6 Apsley Road, The Acres Estate, Horley, RH6 9RX{"\n"}
                    07715104364{"\n"}
                    dannymoffatt75@gmail.com{"\n"}
                    Schwinn 800IC Indoor Cycle{"\n"}
                    Fitshop Equipment Mat - Small{"\n"}
                    SORD64947{"\n"}
                    WK1264357
                  </pre>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-center text-xs text-gray-500">
          <p>Josa Solutions - Installation Worksheet Filler © 2024</p>
        </CardFooter>
      </Card>
    </div>
  )
}
