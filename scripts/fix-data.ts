import fs from 'fs';
import path from 'path';
import { ListingsData } from '../src/lib/types';

const DATA_PATH = path.resolve(__dirname, '../data/listings.json');
const BACKUP_DIR = path.resolve(__dirname, '../data/backups');

const command = process.argv[2];
const args = process.argv.slice(3);

function printUsage() {
  console.log(`사용법:
  npm run fix -- list                       # 백업 목록 조회
  npm run fix -- remove 2026-02-22          # 특정 날짜 데이터 제거
  npm run fix -- remove 2026-02-22 2026-02-23  # 여러 날짜 제거
  npm run fix -- restore 2026-02-22         # 백업에서 특정 날짜 복원
  npm run fix -- rollback 2026-02-22        # 해당 날짜 백업으로 전체 롤백
  npm run fix -- status                     # 현재 데이터 날짜별 요약
`);
}

function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('백업 없음');
    return;
  }
  const files = fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.startsWith('listings-') && f.endsWith('.json'))
    .sort();
  if (files.length === 0) {
    console.log('백업 없음');
    return;
  }
  console.log(`백업 ${files.length}개:`);
  for (const f of files) {
    const stat = fs.statSync(path.join(BACKUP_DIR, f));
    const size = (stat.size / 1024).toFixed(1);
    console.log(`  ${f}  (${size} KB)`);
  }
}

function status() {
  const data: ListingsData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  console.log(`마지막 업데이트: ${data.lastUpdated}`);
  console.log(`아파트 ${data.apartments.length}개:\n`);
  for (const apt of data.apartments) {
    const dates = apt.snapshots.map((s) => s.date).sort();
    console.log(`  ${apt.name} (${apt.complexNo})`);
    console.log(`    날짜: ${dates[0]} ~ ${dates[dates.length - 1]} (${dates.length}일)`);
  }
}

function removeDates(dates: string[]) {
  const data: ListingsData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  let removed = 0;

  for (const apt of data.apartments) {
    const before = apt.snapshots.length;
    apt.snapshots = apt.snapshots.filter((s) => !dates.includes(s.date));
    removed += before - apt.snapshots.length;

    for (const group of apt.byArea ?? []) {
      const beforeArea = group.snapshots.length;
      group.snapshots = group.snapshots.filter((s) => !dates.includes(s.date));
      removed += beforeArea - group.snapshots.length;
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`${dates.join(', ')} 날짜 데이터 ${removed}건 제거 완료`);
}

function restoreDate(targetDate: string) {
  const backupFile = path.join(BACKUP_DIR, `listings-${targetDate}.json`);
  if (!fs.existsSync(backupFile)) {
    // 해당 날짜 백업이 없으면 가장 가까운 이전 백업 탐색
    const files = fs.readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('listings-') && f.endsWith('.json'))
      .sort();
    const candidates = files.filter((f) => f <= `listings-${targetDate}.json`);
    if (candidates.length === 0) {
      console.error(`${targetDate} 이전 백업이 없습니다.`);
      listBackups();
      return;
    }
    const closest = candidates[candidates.length - 1];
    console.log(`${targetDate} 백업 없음. 가장 가까운 백업 사용: ${closest}`);
    restoreDateFrom(targetDate, path.join(BACKUP_DIR, closest));
    return;
  }
  restoreDateFrom(targetDate, backupFile);
}

function restoreDateFrom(targetDate: string, backupPath: string) {
  const current: ListingsData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const backup: ListingsData = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
  let restored = 0;

  for (const apt of current.apartments) {
    const backupApt = backup.apartments.find((a) => a.complexNo === apt.complexNo);
    if (!backupApt) continue;

    // 전체 스냅샷 복원
    const backupSnap = backupApt.snapshots.find((s) => s.date === targetDate);
    if (backupSnap) {
      apt.snapshots = apt.snapshots.filter((s) => s.date !== targetDate);
      apt.snapshots.push(backupSnap);
      apt.snapshots.sort((a, b) => a.date.localeCompare(b.date));
      restored++;
    }

    // 평형별 스냅샷 복원
    for (const group of apt.byArea ?? []) {
      const backupGroup = backupApt.byArea?.find((g) => g.area2 === group.area2);
      if (!backupGroup) continue;
      const backupAreaSnap = backupGroup.snapshots.find((s) => s.date === targetDate);
      if (backupAreaSnap) {
        group.snapshots = group.snapshots.filter((s) => s.date !== targetDate);
        group.snapshots.push(backupAreaSnap);
        group.snapshots.sort((a, b) => a.date.localeCompare(b.date));
        restored++;
      }
    }
  }

  fs.writeFileSync(DATA_PATH, JSON.stringify(current, null, 2), 'utf-8');
  console.log(`${targetDate} 데이터 ${restored}건 백업에서 복원 완료`);
}

function rollback(targetDate: string) {
  const backupFile = path.join(BACKUP_DIR, `listings-${targetDate}.json`);
  if (!fs.existsSync(backupFile)) {
    console.error(`백업 파일 없음: listings-${targetDate}.json`);
    listBackups();
    return;
  }
  fs.copyFileSync(backupFile, DATA_PATH);
  console.log(`listings-${targetDate}.json 으로 전체 롤백 완료`);
}

// --- main ---
switch (command) {
  case 'list':
    listBackups();
    break;
  case 'status':
    status();
    break;
  case 'remove':
    if (args.length === 0) { console.error('날짜를 지정해주세요 (예: 2026-02-22)'); break; }
    removeDates(args);
    break;
  case 'restore':
    if (!args[0]) { console.error('날짜를 지정해주세요'); break; }
    restoreDate(args[0]);
    break;
  case 'rollback':
    if (!args[0]) { console.error('날짜를 지정해주세요'); break; }
    rollback(args[0]);
    break;
  default:
    printUsage();
}
