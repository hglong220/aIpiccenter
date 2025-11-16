/**
 * Excel解析 - 使用exceljs替代xlsx（修复安全漏洞）
 * 
 * 这是一个修复xlsx安全漏洞的示例实现
 * 使用方法: 替换 lib/multimodal-parser.ts 中的 parseExcel 函数
 */

import type { ParseResult } from './multimodal-parser'

/**
 * 解析Excel (使用exceljs)
 */
export async function parseExcelWithExcelJS(file: any): Promise<ParseResult> {
  try {
    // 使用 exceljs 替代 xlsx (修复安全漏洞)
    const ExcelJS = await import('exceljs').catch(() => null)
    
    if (!ExcelJS) {
      throw new Error('exceljs未安装，请运行: npm install exceljs')
    }

    const fs = await import('fs/promises')
    const path = await import('path')
    const filePath = path.join(process.cwd(), 'storage', file.storagePath)
    const fileBuffer = await fs.readFile(filePath)

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(fileBuffer)
    
    // 转换为JSON
    const sheets: Record<string, any[]> = {}
    
    workbook.eachSheet((worksheet, sheetId) => {
      const sheetData: any[] = []
      
      worksheet.eachRow((row, rowNumber) => {
        // 跳过第一行（标题行），如果需要可以保留
        if (rowNumber === 1) {
          // 可以提取标题行作为键
          const headers: string[] = []
          row.eachCell((cell, colNumber) => {
            headers[colNumber - 1] = String(cell.value || `col${colNumber}`)
          })
          // 如果需要，可以保存headers
          return
        }
        
        const rowData: any = {}
        row.eachCell((cell, colNumber) => {
          // 使用列号作为键，或使用标题行
          rowData[colNumber] = cell.value
        })
        if (Object.keys(rowData).length > 0) {
          sheetData.push(rowData)
        }
      })
      
      sheets[worksheet.name] = sheetData
    })
    
    return {
      type: 'document',
      extractedData: sheets,
      metadata: {
        document: {
          pageCount: workbook.worksheets.length,
        },
      },
    }
  } catch (error) {
    throw new Error(`Excel解析失败: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

