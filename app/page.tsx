"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PDFDocument, StandardFonts } from "pdf-lib"
import { Clipboard, FileText, Info, Upload, Check } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"

export default function JobSheetFiller() {
  const [inputData, setInputData] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pdfTemplate, setPdfTemplate] = useState<ArrayBuffer | null>(null)
  const [pdfTemplateUploaded, setPdfTemplateUploaded] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputData(e.target.value)
    setError("")
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if the file is a PDF
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file")
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        setPdfTemplate(event.target.result)
        setPdfTemplateUploaded(true)
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

  const generatePDF = async () => {
    setLoading(true)
    setError("")
    setSuccess(false)

    try {
      if (!pdfTemplate) {
        throw new Error("Please upload the PDF template first")
      }

      // Split the input data by new lines
      const lines = inputData.trim().split("\n")

      if (lines.length < 5) {
        throw new Error("Please provide at least customer name, address, phone, email, and one product")
      }

      // Extract data
      const customerName = lines[0]
      const address = lines[1]
      const phone = lines[2]
      const email = lines[3]

      // Products can be variable (up to 10)
      const products = []
      let currentLine = 4

      // Collect products until we reach SORD number or run out of lines
      while (currentLine < lines.length && products.length < 10) {
        // If we've reached what looks like a SORD number, stop collecting products
        if (
          lines[currentLine].toUpperCase().includes("SORD") ||
          (currentLine < lines.length - 1 && lines[currentLine + 1].startsWith("WK"))
        ) {
          break
        }

        if (lines[currentLine].trim()) {
          products.push(lines[currentLine])
        }
        currentLine++
      }

      // The remaining lines should be SORD and optionally WK
      const sordNumber = lines[currentLine] || ""
      const wkNumber = lines[currentLine + 1] || ""

      // Validate WK number if provided
      if (wkNumber && !wkNumber.startsWith("WK")) {
        throw new Error("WK Number must start with 'WK'")
      }

      // Load the PDF template from the uploaded file
      try {
        const pdfDoc = await PDFDocument.load(pdfTemplate)
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)

        // Get the first page
        const page = pdfDoc.getPages()[0]
        const { width, height } = page.getSize()

        // Define positions for text placement based on the actual PDF form
        // Install Date (top right)
        const currentDate = new Date().toLocaleDateString("en-GB")
        page.drawText(currentDate, {
          x: 150,
          y: height - 85,
          size: 10,
          font: helveticaFont,
        })

        // WK REF (top right, next to Install Date)
        if (wkNumber) {
          page.drawText(wkNumber, {
            x: 400,
            y: height - 85,
            size: 10,
            font: helveticaFont,
          })
        }

        // Customer Name (left side)
        page.drawText(customerName, {
          x: 150,
          y: height - 125,
          size: 10,
          font: helveticaFont,
        })

        // SORD NUMBER (right side, same line as customer name)
        page.drawText(sordNumber, {
          x: 400,
          y: height - 125,
          size: 10,
          font: helveticaFont,
        })

        // Customer Address (left side, below customer name)
        page.drawText(address, {
          x: 150,
          y: height - 145,
          size: 10,
          font: helveticaFont,
        })

        // Phone Number (left side)
        page.drawText(phone, {
          x: 150,
          y: height - 185,
          size: 10,
          font: helveticaFont,
        })

        // Email Address (right side, same line as phone)
        page.drawText(email, {
          x: 350,
          y: height - 185,
          size: 10,
          font: helveticaFont,
        })

        // Install Date (repeated in middle section)
        page.drawText(currentDate, {
          x: 100,
          y: height - 225,
          size: 10,
          font: helveticaFont,
        })

        // Install Operative (right side of install date line)
        page.drawText("Danny Moffatt", {
          x: 350,
          y: height - 225,
          size: 10,
          font: helveticaFont,
        })

        // Products section - starting around y=350 from top
        products.forEach((product, index) => {
          page.drawText(product, {
            x: 50,
            y: height - 280 - index * 20,
            size: 10,
            font: helveticaFont,
          })
        })

        // Save the PDF
        const filledPdfBytes = await pdfDoc.save()

        // Convert to Blob and download using native browser API
        const blob = new Blob([filledPdfBytes], { type: "application/pdf" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `job-sheet-${customerName.replace(/\s+/g, "-")}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        setSuccess(true)
      } catch (pdfError) {
        console.error("PDF processing error:", pdfError)
        throw new Error(`Failed to process PDF: ${pdfError instanceof Error ? pdfError.message : "Unknown error"}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate PDF")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-md mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Job Sheet Filler</CardTitle>
          <CardDescription>Upload your PDF template and paste your data to generate a filled job sheet</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="template">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="input">Input</TabsTrigger>
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
            </TabsList>
            <TabsContent value="template">
              <div className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="pdf-upload">Upload PDF Template</Label>
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
                      {pdfTemplateUploaded ? (
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
                  <p className="text-sm text-muted-foreground">Upload the "NEW JOB SHEET - 2024.pdf" template</p>
                </div>

                {pdfTemplateUploaded && (
                  <Alert className="bg-green-50 text-green-800 border-green-200">
                    <Check className="h-4 w-4" />
                    <AlertTitle>Template Ready</AlertTitle>
                    <AlertDescription>PDF template uploaded successfully!</AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            <TabsContent value="input">
              <div className="space-y-4">
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
              </div>
            </TabsContent>
            <TabsContent value="instructions">
              <div className="space-y-4 text-sm">
                <p>Paste your data in this exact order (one line per field):</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>Customer Name</li>
                  <li>Address</li>
                  <li>Phone</li>
                  <li>Email</li>
                  <li>Product 1</li>
                  <li>Product 2 (optional)</li>
                  <li>... (up to 10 products)</li>
                  <li>SORD Number</li>
                  <li>WK Number (optional, must start with WK)</li>
                </ol>
                <p className="text-muted-foreground italic">
                  Note: The app will automatically detect where your products end and the SORD/WK numbers begin.
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-2">
            <Button
              onClick={generatePDF}
              disabled={loading || !inputData.trim() || !pdfTemplateUploaded}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate PDF"}
            </Button>
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
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
