const DRIVE_FOLDER_ID = '16qGODaATJmWlSpXJy1kIvhtxz1OOc6NB';
const SPREADSHEET_NAME = 'ER Selaphum Hospital Submissions';

function doGet(e) {
  if (e && e.parameter && e.parameter.action === 'delete') {
    try {
      return jsonOutput_(deleteSubmission_(e.parameter));
    } catch (error) {
      return jsonOutput_({
        status: 'error',
        error: 'ไม่สามารถลบข้อมูลได้: ' + error.toString()
      });
    }
  }

  if (e && e.parameter && e.parameter.action === 'list') {
    try {
      const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
      const spreadsheet = getOrCreateSpreadsheet_(folder);
      const sheet = spreadsheet.getSheets()[0];
      ensureHeader_(sheet);
      const works = listSubmissions_(sheet);

      return jsonOutput_({
        status: 'success',
        data: works,
        works: works,
        spreadsheetUrl: spreadsheet.getUrl()
      });
    } catch (error) {
      return jsonOutput_({
        status: 'error',
        error: 'ไม่สามารถโหลดข้อมูลเดิมได้: ' + error.toString()
      });
    }
  }

  if (e && e.parameter && e.parameter.action === 'ping') {
    return jsonOutput_({
      status: 'success',
      message: 'ER Selaphum Hospital Submission API is running successfully.',
      folderId: DRIVE_FOLDER_ID
    });
  }

  return ContentService
    .createTextOutput('ER Selaphum Hospital Submission API is running successfully.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  try {
    const data = parseRequest_(e);
    if (data.action === 'delete') {
      return jsonOutput_(deleteSubmission_(data));
    }

    const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const now = new Date();

    let fileUrl = '-';
    let fileId = '';

    if (data.fileData && data.fileName) {
      const cleanBase64 = String(data.fileData).replace(/^data:[^,]+,/, '');
      const bytes = Utilities.base64Decode(cleanBase64);
      const blob = Utilities.newBlob(
        bytes,
        data.mimeType || MimeType.PLAIN_TEXT,
        sanitizeFileName_(data.fileName)
      );
      const file = folder.createFile(blob);
      fileUrl = file.getUrl();
      fileId = file.getId();
    }

    const spreadsheet = getOrCreateSpreadsheet_(folder);
    const sheet = spreadsheet.getSheets()[0];
    ensureHeader_(sheet);
    sheet.appendRow([
      data.timestamp || Utilities.formatDate(now, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm'),
      data.id || ('JOB-' + now.getTime()),
      data.senderName || '',
      data.department || '',
      data.workTitle || '',
      data.workDetail || '',
      data.fileName || '',
      fileUrl,
      data.status || 'รอตรวจสอบ',
      Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss'),
      fileId
    ]);

    return jsonOutput_({
      status: 'success',
      fileUrl: fileUrl,
      fileId: fileId,
      spreadsheetUrl: spreadsheet.getUrl()
    });
  } catch (error) {
    return jsonOutput_({
      status: 'error',
      error: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์: ' + error.toString()
    });
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('ไม่พบข้อมูลที่ส่งมา');
  }

  return JSON.parse(e.postData.contents);
}

function getOrCreateSpreadsheet_(folder) {
  const properties = PropertiesService.getScriptProperties();
  const savedSpreadsheetId = properties.getProperty('SPREADSHEET_ID');

  if (savedSpreadsheetId) {
    try {
      return SpreadsheetApp.openById(savedSpreadsheetId);
    } catch (error) {
      properties.deleteProperty('SPREADSHEET_ID');
    }
  }

  const existingFiles = folder.getFilesByName(SPREADSHEET_NAME);
  while (existingFiles.hasNext()) {
    const file = existingFiles.next();
    if (file.getMimeType() === MimeType.GOOGLE_SHEETS) {
      properties.setProperty('SPREADSHEET_ID', file.getId());
      return SpreadsheetApp.openById(file.getId());
    }
  }

  const spreadsheet = SpreadsheetApp.create(SPREADSHEET_NAME);
  DriveApp.getFileById(spreadsheet.getId()).moveTo(folder);
  properties.setProperty('SPREADSHEET_ID', spreadsheet.getId());
  return spreadsheet;
}

function ensureHeader_(sheet) {
  const headers = [
    'วันที่ส่ง',
    'รหัสงาน',
    'ชื่อผู้ส่ง',
    'ตำแหน่ง',
    'หัวข้องาน',
    'รายละเอียด',
    'ชื่อไฟล์',
    'ลิงก์ไฟล์',
    'สถานะ',
    'เวลาบันทึกระบบ',
    'รหัสไฟล์'
  ];

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }

  const lastColumn = sheet.getLastColumn();
  if (lastColumn < headers.length) {
    sheet.getRange(1, lastColumn + 1, 1, headers.length - lastColumn)
      .setValues([headers.slice(lastColumn)]);
  }
}

function listSubmissions_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  return values.map(function(row) {
    return {
      timestamp: formatSheetValue_(row[0]),
      id: String(row[1] || ''),
      senderName: String(row[2] || ''),
      department: String(row[3] || ''),
      workTitle: String(row[4] || ''),
      workDetail: String(row[5] || ''),
      fileName: String(row[6] || ''),
      fileUrl: String(row[7] || '#'),
      status: String(row[8] || 'รอตรวจสอบ'),
      savedAt: formatSheetValue_(row[9]),
      fileId: String(row[10] || extractDriveFileId_(row[7]) || ''),
      fileData: '',
      mimeType: ''
    };
  }).reverse();
}

function deleteSubmission_(data) {
  const id = String(data.id || '').trim();
  if (!id) {
    throw new Error('ไม่พบรหัสงานที่ต้องการลบ');
  }

  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const spreadsheet = getOrCreateSpreadsheet_(folder);
  const sheet = spreadsheet.getSheets()[0];
  ensureHeader_(sheet);

  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) {
    throw new Error('ไม่พบข้อมูลในชีต');
  }

  const values = sheet.getRange(2, 1, lastRow - 1, 11).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    const row = values[i];
    if (String(row[1] || '').trim() !== id) continue;

    const rowNumber = i + 2;
    const fileUrl = String(data.fileUrl || row[7] || '');
    const fileId = String(data.fileId || row[10] || extractDriveFileId_(fileUrl) || '').trim();
    let fileTrashed = false;

    if (fileId) {
      DriveApp.getFileById(fileId).setTrashed(true);
      fileTrashed = true;
    }

    sheet.deleteRow(rowNumber);

    return {
      status: 'success',
      deletedId: id,
      deletedRow: rowNumber,
      fileId: fileId,
      fileTrashed: fileTrashed,
      spreadsheetUrl: spreadsheet.getUrl()
    };
  }

  throw new Error('ไม่พบรายการนี้ใน Google Sheet');
}

function extractDriveFileId_(url) {
  const text = String(url || '');
  const filePathMatch = text.match(/\/d\/([a-zA-Z0-9_-]{20,})/);
  if (filePathMatch) return filePathMatch[1];

  const idParamMatch = text.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (idParamMatch) return idParamMatch[1];

  return '';
}

function formatSheetValue_(value) {
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) {
    return Utilities.formatDate(value, 'Asia/Bangkok', 'dd/MM/yyyy HH:mm');
  }

  return value === null || value === undefined ? '' : String(value);
}

function sanitizeFileName_(fileName) {
  return String(fileName).replace(/[\\/:*?"<>|]/g, '_').trim() || 'uploaded-file';
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
