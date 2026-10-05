# ระบบส่งงาน งานอุบัติเหตุฉุกเฉินและนิติเวช

เว็บฟอร์มส่งงานสำหรับ ER Selaphum Hospital ใช้แนบไฟล์ ส่งข้อมูลไปยัง Google Apps Script และจัดเก็บไฟล์ใน Google Drive

## ลิงก์ใช้งาน

เมื่อ GitHub Pages deploy สำเร็จ ให้เปิดที่:

https://seansanong-wee.github.io/Report/

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
