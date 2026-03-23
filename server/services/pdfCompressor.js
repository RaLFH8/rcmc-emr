import { PDFDocument } from 'pdf-lib'

/**
 * Compress PDF file
 * Reduces file size by removing unnecessary data and optimizing images
 */
export async function compressPDF(pdfBuffer) {
  try {
    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer)

    // Get basic info
    const pageCount = pdfDoc.getPageCount()
    console.log(`📄 PDF has ${pageCount} pages`)

    // Save with compression options
    const compressedPdfBytes = await pdfDoc.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: 50
    })

    const originalSize = pdfBuffer.length
    const compressedSize = compressedPdfBytes.length
    const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1)

    console.log(`📦 Compression: ${compressionRatio}% reduction`)

    return Buffer.from(compressedPdfBytes)
  } catch (error) {
    console.error('PDF compression error:', error)
    // If compression fails, return original buffer
    console.warn('⚠️ Compression failed, using original file')
    return pdfBuffer
  }
}

/**
 * Get PDF metadata
 */
export async function getPDFMetadata(pdfBuffer) {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer)
    
    return {
      pageCount: pdfDoc.getPageCount(),
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      subject: pdfDoc.getSubject(),
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate(),
      modificationDate: pdfDoc.getModificationDate()
    }
  } catch (error) {
    console.error('PDF metadata error:', error)
    return null
  }
}
