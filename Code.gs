const DRIVE_FOLDER_ID = '16qGODaATJmWlSpXJy1kIvhtxz1OOc6NB';
const SPREADSHEET_NAME = 'ER Selaphum Hospital Submissions';

function doGet(e) {
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
      Utilities.formatDate(now, 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss')
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
  if (sheet.getLastRow() > 0) return;

  sheet.appendRow([
    'วันที่ส่ง',
    'รหัสงาน',
    'ชื่อผู้ส่ง',
    'ตำแหน่ง',
    'หัวข้องาน',
    'รายละเอียด',
    'ชื่อไฟล์',
    'ลิงก์ไฟล์',
    'สถานะ',
    'เวลาบันทึกระบบ'
  ]);
}

function sanitizeFileName_(fileName) {
  return String(fileName).replace(/[\\/:*?"<>|]/g, '_').trim() || 'uploaded-file';
}

function jsonOutput_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
