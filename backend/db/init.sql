CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  story TEXT NOT NULL,
  hint TEXT NOT NULL,
  commands JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  player TEXT NOT NULL,
  level_id INT REFERENCES levels(id),
  attempts INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO levels (slug, title, difficulty, story, hint, commands) VALUES
('nginx-down', 'Level 1: Website Down', 'Easy',
 'Customer bol raha hai website khul nahi rahi. Tum server pe login ho. Fix karo!',
 'Pehle service ka status dekho: systemctl status nginx',
 $j$[
  {"pattern":"^(sudo )?systemctl status nginx","output":"nginx.service - A high performance web server\n   Active: inactive (dead)"},
  {"pattern":"^curl","output":"curl: (7) Failed to connect to localhost port 80: Connection refused"},
  {"pattern":"^ls","output":"index.html  app.conf"},
  {"pattern":"^sudo systemctl (start|restart) nginx","output":"nginx started. Website is UP!","solves":true}
 ]$j$),
('disk-full', 'Level 2: Disk Full', 'Medium',
 'App crash ho rahi hai: "No space left on device". Disk bhar gayi hai, jagah banao.',
 'df -h se disk dekho, du -sh /var/log/* se bada file dhundo',
 $j$[
  {"pattern":"^df","output":"Filesystem  Size  Used  Use%  Mounted on\n/dev/sda1    50G   50G  100%  /"},
  {"pattern":"^du -sh /var/log","output":"48G  /var/log/app.log\n1G   /var/log/syslog"},
  {"pattern":"^ls /var/log","output":"app.log  syslog"},
  {"pattern":"^sudo (rm|truncate).*app","output":"app.log cleared. 47G free now!","solves":true}
 ]$j$),
('permission-denied', 'Level 3: Permission Denied', 'Easy',
 'Deploy script chalate hi "Permission denied" aa raha hai. Script ko runnable banao.',
 'ls -l deploy.sh dekho, phir chmod use karo',
 $j$[
  {"pattern":"^ls -l","output":"-rw-r--r-- 1 ubuntu ubuntu 120 deploy.sh"},
  {"pattern":"^\\./deploy","output":"bash: ./deploy.sh: Permission denied"},
  {"pattern":"^chmod (.x|755|u.x) deploy","output":"Permission fixed. deploy.sh runs OK!","solves":true}
 ]$j$)
ON CONFLICT (slug) DO NOTHING;
