-- 國中生物獨立成課（業主 2026-07-15 拍板）
-- 在 Supabase Dashboard → SQL Editor 執行（專案 cciflmurpbnbjvbeunty）。
-- 欄位名若與 dashboard 實際不符，以 dashboard 為準（本檔依 2026-06 資料模型撰寫）。
-- 執行完記得 Vercel Redeploy，官網才會反映。

-- 1) 課程目錄加「國中生物」（slug 必須 = src/content/courses/junior-biology.md 的檔名）
insert into courses (slug, name, grade, subject, teacher_slug, trial_lessons, display_order)
values ('junior-biology', '國中生物小班', '國中', '生物', 'barney', 2,
        (select display_order + 1 from courses where slug = 'junior-science'));

-- 2) 國中自然更名（與官網頁面一致）
update courses set name = '國中自然（理化＋地科）' where slug = 'junior-science';

-- 3) 生物排課（⚠ 時段是佔位值，業主填實際的星期/時間/教室再執行；每週 1.5 小時）
--    weekday：1=週一 … 7=週日；location_key：jobs=賈伯斯、shinobi=忍文理
-- insert into teacher_availability (teacher_slug, location_key, weekday, subject, grade, start_time, end_time, published)
-- values ('barney', 'jobs', 2, '生物', '國中', '18:00', '19:30', true);
