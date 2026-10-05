# ระบบส่งงาน งานอุบัติเหตุฉุกเฉินและนิติเวช

เว็บฟอร์มส่งงานสำหรับ ER Selaphum Hospital ใช้แนบไฟล์ ส่งข้อมูลไปยัง Google Apps Script และจัดเก็บไฟล์ใน Google Drive

## ลิงก์ใช้งานทันที

เปิดหน้าเว็บจากไฟล์ใน GitHub ได้ที่:

https://raw.githack.com/seansanong-wee/Report/main/index.html

## ลิงก์ GitHub Pages

เมื่อ GitHub Pages deploy สำเร็จ ให้เปิดที่:

https://seansanong-wee.github.io/Report/

ถ้าลิงก์ GitHub Pages ยังขึ้น 404 ให้เปิด GitHub repo แล้วตั้งค่า:

1. ไปที่ Settings > Pages
2. Source เลือก GitHub Actions
3. ไปที่ Actions
4. เปิด workflow `Deploy GitHub Pages`
5. กด Run workflow หรือ Re-run failed jobs

## ไฟล์สำคัญ

- `index.html` หน้าเว็บหลัก
- `Code.gs` โค้ด Google Apps Script backend ที่ใช้บันทึกไฟล์ลง Google Drive
- `วิธีแก้-Apps-Script.txt` ขั้นตอนนำ `Code.gs` ไป deploy ใน Google Apps Script

## การตั้งค่า Google Apps Script

ต้องนำโค้ดใน `Code.gs` ไปวางในโปรเจกต์ Google Apps Script แล้ว deploy เป็น Web App โดยตั้งค่า:

- Execute as: Me
- Who has access: Anyone

Folder ID ที่ใช้จัดเก็บไฟล์:

```text
16qGODaATJmWlSpXJy1kIvhtxz1OOc6NB
```

หลัง deploy แล้ว ถ้าได้ Web App URL ใหม่ ให้นำ URL นั้นไปใส่ในช่องตั้งค่า Google Apps Script บนหน้าเว็บ แล้วกดบันทึก URL เชื่อมต่อ

หมายเหตุ: หน้าเว็บถูกนำขึ้น GitHub แล้ว แต่การส่งไฟล์เข้า Google Drive จะใช้งานได้จริงหลังจากนำ `Code.gs` ไป deploy ใน Google Apps Script แล้วเท่านั้น

## การโหลดข้อมูลเดิม

เมื่อเปิดหน้าเว็บใหม่หรือเข้าแท็บแดชบอร์ด ระบบจะแสดงข้อมูลในเครื่องก่อน แล้วดึงข้อมูลล่าสุดจาก Google Sheet ผ่าน Apps Script (`?action=list`) มาแสดงและบันทึกไว้ในเครื่องอัตโนมัติ

ถ้าแดชบอร์ดขึ้นข้อความว่า Apps Script ยังไม่ใช่เวอร์ชันล่าสุด ให้นำไฟล์ `Code.gs` ใน repo ไปวางแทนโค้ดเดิมใน Google Apps Script แล้ว Deploy เป็น New version อีกครั้ง

## การลบข้อมูล

เมื่อกดลบในแดชบอร์ด ระบบจะเรียก Apps Script (`?action=delete`) เพื่อลบแถวข้อมูลใน Google Sheet และย้ายไฟล์แนบใน Google Drive ไปถังขยะก่อน จากนั้นจึงลบรายการออกจากหน้าแดชบอร์ด
