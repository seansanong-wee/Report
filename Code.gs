const DRIVE_FOLDER_ID = '16qGODaATJmWlSpXJy1kIvhtxz1OOc6NB';
const SPREADSHEET_NAME = 'ER Selaphum Hospital Submissions';

function doGet(e) {
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

function listSubmissions_(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 10).getValues();
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
      fileData: '',
      mimeType: ''
    };
  }).reverse();
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
