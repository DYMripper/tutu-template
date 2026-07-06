/* ============================================================
   数据区：以后新增分类 / 模板，只需要在这个文件里改这个对象即可。
   ----------------------------------------------------------
   每个分类(category)：
     key      —— 唯一标识（英文/拼音，不要重复）
     name     —— 显示在网站上的分类名称
     image    —— 分类封面图（显示在首页卡片上）
     items    —— 该分类下的模板数组

   每个模板(item)：
     code     —— 编号，例如 "PST-001"（会显示在卡片和放大图上）
     image    —— 模板图片地址。换成你自己的图片 URL 即可。支持多图逻辑：任何一项的 image 都可以写 1 个到无限多个路径（例：["1.jpg", "2.jpg"]）
     color    —— 占位色块的颜色（没有图片时使用），可选
     ratio    —— 比例控制，例如 "16/9"、"1"、"4/3"、"3/4"，不填默认竖版 3/4
   ============================================================ */
const DATA = [
  {
    key:"Sponsored_Card",
    name:"冠名卡（可改冠歌/情侣卡）",
    image:"./Sponsored_Card.jpg", /* 分类封面大图 */
    items:[
      {code:"冠名卡-187", image:["./Sponsored_Card_Template/187.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-187", image:["./Sponsored_Card_Template/187.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-186", image:["./Sponsored_Card_Template/186.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-186", image:["./Sponsored_Card_Template/186.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-185", image:["./Sponsored_Card_Template/185.3.jpg"], color:"#C8472B"},
      {code:"冠名卡-185", image:["./Sponsored_Card_Template/185.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-184", image:["./Sponsored_Card_Template/184.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-184", image:["./Sponsored_Card_Template/184.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-183", image:["./Sponsored_Card_Template/183.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-183", image:["./Sponsored_Card_Template/183.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-182", image:["./Sponsored_Card_Template/182.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-182", image:["./Sponsored_Card_Template/182.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-181", image:["./Sponsored_Card_Template/181.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-181", image:["./Sponsored_Card_Template/181.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-180", image:["./Sponsored_Card_Template/180.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-180", image:["./Sponsored_Card_Template/180.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-179", image:["./Sponsored_Card_Template/179.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-179", image:["./Sponsored_Card_Template/179.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-178", image:["./Sponsored_Card_Template/178.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-178", image:["./Sponsored_Card_Template/178.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-177", image:["./Sponsored_Card_Template/177.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-177", image:["./Sponsored_Card_Template/177.jpg"], color:"#C8472B"},
      {code:"冠名卡-176", image:["./Sponsored_Card_Template/176.2.jpg"], color:"#C8472B"},
      {code:"冠名卡-176", image:["./Sponsored_Card_Template/176.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-175", image:["./Sponsored_Card_Template/175.1.jpg"], color:"#C8472B"},
      {code:"冠名卡-175", image:["./Sponsored_Card_Template/175.jpg"], color:"#C8472B"},
      {code:"冠名卡-171", image:["./Sponsored_Card_Template/171.jpg"], color:"#C8472B"},
      {code:"冠名卡-170", image:["./Sponsored_Card_Template/170.jpg"], color:"#C8472B"},
      {code:"冠名卡-169", image:["./Sponsored_Card_Template/169.jpg"], color:"#C8472B"},
      {code:"冠名卡-168", image:["./Sponsored_Card_Template/168.jpg"], color:"#C8472B"},
      {code:"冠名卡-167", image:["./Sponsored_Card_Template/167.jpg"], color:"#C8472B"},
      {code:"冠名卡-166", image:["./Sponsored_Card_Template/166.jpg"], color:"#C8472B"},
      {code:"冠名卡-165", image:["./Sponsored_Card_Template/165.jpg"], color:"#C8472B"},
      {code:"冠名卡-164", image:["./Sponsored_Card_Template/164.jpg"], color:"#C8472B"},
      {code:"冠名卡-163", image:["./Sponsored_Card_Template/163.jpg"], color:"#C8472B"},
      {code:"冠名卡-162", image:["./Sponsored_Card_Template/162.jpg"], color:"#C8472B"},
      {code:"冠名卡-161", image:["./Sponsored_Card_Template/161.jpg"], color:"#C8472B"},
      {code:"冠名卡-160", image:["./Sponsored_Card_Template/160.jpg"], color:"#C8472B"},
      {code:"冠名卡-159", image:["./Sponsored_Card_Template/159.jpg"], color:"#C8472B"},
      {code:"冠名卡-158", image:["./Sponsored_Card_Template/158.jpg"], color:"#C8472B"},
      {code:"冠名卡-157", image:["./Sponsored_Card_Template/157.jpg"], color:"#C8472B"},
      {code:"冠名卡-156", image:["./Sponsored_Card_Template/156.jpg"], color:"#C8472B"},
      {code:"冠名卡-155", image:["./Sponsored_Card_Template/155.jpg"], color:"#C8472B"},
      {code:"冠名卡-154", image:["./Sponsored_Card_Template/154.jpg"], color:"#C8472B"},
      {code:"冠名卡-153", image:["./Sponsored_Card_Template/153.jpg"], color:"#C8472B"},
      {code:"冠名卡-152", image:["./Sponsored_Card_Template/152.jpg"], color:"#C8472B"},
      {code:"冠名卡-151", image:["./Sponsored_Card_Template/151.jpg"], color:"#C8472B"},
      {code:"冠名卡-150", image:["./Sponsored_Card_Template/150.jpg"], color:"#C8472B"},
      {code:"冠名卡-149", image:["./Sponsored_Card_Template/149.jpg"], color:"#C8472B"},
      {code:"冠名卡-148", image:["./Sponsored_Card_Template/148.jpg"], color:"#C8472B"},
      {code:"冠名卡-149", image:["./Sponsored_Card_Template/149.jpg"], color:"#C8472B"},
      {code:"冠名卡-148", image:["./Sponsored_Card_Template/148.jpg"], color:"#C8472B"},
      {code:"冠名卡-147", image:["./Sponsored_Card_Template/147.jpg"], color:"#C8472B"},
      {code:"冠名卡-146", image:["./Sponsored_Card_Template/146.jpg"], color:"#C8472B"},
      {code:"冠名卡-145", image:["./Sponsored_Card_Template/145.jpg"], color:"#C8472B"},
      {code:"冠名卡-144", image:["./Sponsored_Card_Template/144.jpg"], color:"#C8472B"},
      {code:"冠名卡-143", image:["./Sponsored_Card_Template/143.jpg"], color:"#C8472B"},
      {code:"冠名卡-142", image:["./Sponsored_Card_Template/142.jpg"], color:"#C8472B"},
      {code:"冠名卡-141", image:["./Sponsored_Card_Template/141.jpg"], color:"#C8472B"},
      {code:"冠名卡-140", image:["./Sponsored_Card_Template/140.jpg"], color:"#C8472B"},
      {code:"冠名卡-139", image:["./Sponsored_Card_Template/139.jpg"], color:"#C8472B"},
      {code:"冠名卡-138", image:["./Sponsored_Card_Template/138.jpg"], color:"#C8472B"},
      {code:"冠名卡-137", image:["./Sponsored_Card_Template/137.jpg"], color:"#C8472B"},
      {code:"冠名卡-136", image:["./Sponsored_Card_Template/136.jpg"], color:"#C8472B"},
      {code:"冠名卡-135", image:["./Sponsored_Card_Template/135.jpg"], color:"#C8472B"},
      {code:"冠名卡-134", image:["./Sponsored_Card_Template/134.jpg"], color:"#C8472B"},
      {code:"冠名卡-133", image:["./Sponsored_Card_Template/133.jpg"], color:"#C8472B"},
      {code:"冠名卡-130", image:["./Sponsored_Card_Template/130.jpg"], color:"#C8472B"},
      {code:"冠名卡-129", image:["./Sponsored_Card_Template/129.jpg"], color:"#C8472B"},
      {code:"冠名卡-128", image:["./Sponsored_Card_Template/128.jpg"], color:"#C8472B"},
      {code:"冠名卡-127", image:["./Sponsored_Card_Template/127.jpg"], color:"#C8472B"},
      {code:"冠名卡-126", image:["./Sponsored_Card_Template/126.jpg"], color:"#C8472B"},
      {code:"冠名卡-125", image:["./Sponsored_Card_Template/125.jpg"], color:"#C8472B"},
      {code:"冠名卡-124", image:["./Sponsored_Card_Template/124.jpg"], color:"#C8472B"},
      {code:"冠名卡-123", image:["./Sponsored_Card_Template/123.jpg"], color:"#C8472B"},
      {code:"冠名卡-122", image:["./Sponsored_Card_Template/122.jpg"], color:"#C8472B"},
      {code:"冠名卡-121", image:["./Sponsored_Card_Template/121.jpg"], color:"#C8472B"},
      {code:"冠名卡-120", image:["./Sponsored_Card_Template/120.jpg"], color:"#C8472B"},
      {code:"冠名卡-119", image:["./Sponsored_Card_Template/119.jpg"], color:"#C8472B"},
      {code:"冠名卡-118", image:["./Sponsored_Card_Template/118.jpg"], color:"#C8472B"},
      {code:"冠名卡-117", image:["./Sponsored_Card_Template/117.jpg"], color:"#C8472B"},
      {code:"冠名卡-116", image:["./Sponsored_Card_Template/116.jpg"], color:"#C8472B"},
      {code:"冠名卡-115", image:["./Sponsored_Card_Template/115.jpg"], color:"#C8472B"},
      {code:"冠名卡-114", image:["./Sponsored_Card_Template/114.jpg"], color:"#C8472B"},
      {code:"冠名卡-113", image:["./Sponsored_Card_Template/113.jpg"], color:"#C8472B"},
      {code:"冠名卡-112", image:["./Sponsored_Card_Template/112.jpg"], color:"#C8472B"},
      {code:"冠名卡-111", image:["./Sponsored_Card_Template/111.jpg"], color:"#C8472B"},
      {code:"冠名卡-110", image:["./Sponsored_Card_Template/110.jpg"], color:"#C8472B"},
      {code:"冠名卡-109", image:["./Sponsored_Card_Template/109.jpg"], color:"#C8472B"},
      {code:"冠名卡-108", image:["./Sponsored_Card_Template/108.jpg"], color:"#C8472B"},
      {code:"冠名卡-107", image:["./Sponsored_Card_Template/107.jpg"], color:"#C8472B"},
      {code:"冠名卡-106", image:["./Sponsored_Card_Template/106.jpg"], color:"#C8472B"},
      {code:"冠名卡-105", image:["./Sponsored_Card_Template/105.jpg"], color:"#C8472B"},
      {code:"冠名卡-104", image:["./Sponsored_Card_Template/104.jpg"], color:"#C8472B"},
      {code:"冠名卡-103", image:["./Sponsored_Card_Template/103.jpg"], color:"#C8472B"},
      {code:"冠名卡-102", image:["./Sponsored_Card_Template/102.jpg"], color:"#C8472B"},
      {code:"冠名卡-101", image:["./Sponsored_Card_Template/101.jpg"], color:"#C8472B"},
      {code:"冠名卡-100", image:["./Sponsored_Card_Template/100.jpg"], color:"#C8472B"},
      {code:"冠名卡-99", image:["./Sponsored_Card_Template/99.jpg"], color:"#C8472B"},
      {code:"冠名卡-98", image:["./Sponsored_Card_Template/98.jpg"], color:"#C8472B"},
      {code:"冠名卡-97", image:["./Sponsored_Card_Template/97.jpg"], color:"#C8472B"},
      {code:"冠名卡-96", image:["./Sponsored_Card_Template/96.jpg"], color:"#C8472B"},
      {code:"冠名卡-95", image:["./Sponsored_Card_Template/95.jpg"], color:"#C8472B"},
      {code:"冠名卡-94", image:["./Sponsored_Card_Template/94.jpg"], color:"#C8472B"},
      {code:"冠名卡-93", image:["./Sponsored_Card_Template/93.jpg"], color:"#C8472B"},
      {code:"冠名卡-92", image:["./Sponsored_Card_Template/92.jpg"], color:"#C8472B"},
      {code:"冠名卡-91", image:["./Sponsored_Card_Template/91.jpg"], color:"#C8472B"},
      {code:"冠名卡-90", image:["./Sponsored_Card_Template/90.jpg"], color:"#C8472B"},
      {code:"冠名卡-89", image:["./Sponsored_Card_Template/89.jpg"], color:"#C8472B"},
      {code:"冠名卡-88", image:["./Sponsored_Card_Template/88.jpg"], color:"#C8472B"},
      {code:"冠名卡-87", image:["./Sponsored_Card_Template/87.jpg"], color:"#C8472B"},
      {code:"冠名卡-86", image:["./Sponsored_Card_Template/86.jpg"], color:"#C8472B"},
      {code:"冠名卡-85", image:["./Sponsored_Card_Template/85.jpg"], color:"#C8472B"},
      {code:"冠名卡-84", image:["./Sponsored_Card_Template/84.jpg"], color:"#C8472B"},
      {code:"冠名卡-83", image:["./Sponsored_Card_Template/83.jpg"], color:"#C8472B"},
      {code:"冠名卡-82", image:["./Sponsored_Card_Template/82.jpg"], color:"#C8472B"},
      {code:"冠名卡-81", image:["./Sponsored_Card_Template/81.jpg"], color:"#C8472B"},
      {code:"冠名卡-80", image:["./Sponsored_Card_Template/80.jpg"], color:"#C8472B"},
      {code:"冠名卡-79", image:["./Sponsored_Card_Template/79.jpg"], color:"#C8472B"},
      {code:"冠名卡-78", image:["./Sponsored_Card_Template/78.jpg"], color:"#C8472B"},
      {code:"冠名卡-77", image:["./Sponsored_Card_Template/77.jpg"], color:"#C8472B"},
      {code:"冠名卡-76", image:["./Sponsored_Card_Template/76.jpg"], color:"#C8472B"},
      {code:"冠名卡-75", image:["./Sponsored_Card_Template/75.jpg"], color:"#C8472B"},
      {code:"冠名卡-74", image:["./Sponsored_Card_Template/74.jpg"], color:"#C8472B"},
      {code:"冠名卡-73", image:["./Sponsored_Card_Template/73.jpg"], color:"#C8472B"},
      {code:"冠名卡-72", image:["./Sponsored_Card_Template/72.jpg"], color:"#C8472B"},
      {code:"冠名卡-71", image:["./Sponsored_Card_Template/71.jpg"], color:"#C8472B"},
      {code:"冠名卡-70", image:["./Sponsored_Card_Template/70.jpg"], color:"#C8472B"},
      {code:"冠名卡-69", image:["./Sponsored_Card_Template/69.jpg"], color:"#C8472B"},
      {code:"冠名卡-68", image:["./Sponsored_Card_Template/68.jpg"], color:"#C8472B"},
      {code:"冠名卡-67", image:["./Sponsored_Card_Template/67.jpg"], color:"#C8472B"},
      {code:"冠名卡-66", image:["./Sponsored_Card_Template/66.jpg"], color:"#C8472B"},
      {code:"冠名卡-65", image:["./Sponsored_Card_Template/65.jpg"], color:"#C8472B"},
      {code:"冠名卡-64", image:["./Sponsored_Card_Template/64.jpg"], color:"#C8472B"},
      {code:"冠名卡-63", image:["./Sponsored_Card_Template/63.jpg"], color:"#C8472B"},
      {code:"冠名卡-62", image:["./Sponsored_Card_Template/62.jpg"], color:"#C8472B"},
      {code:"冠名卡-61", image:["./Sponsored_Card_Template/61.jpg"], color:"#C8472B"},
      {code:"冠名卡-60", image:["./Sponsored_Card_Template/60.jpg"], color:"#C8472B"},
      {code:"冠名卡-59", image:["./Sponsored_Card_Template/59.jpg"], color:"#C8472B"},
      {code:"冠名卡-58", image:["./Sponsored_Card_Template/58.jpg"], color:"#C8472B"},
      {code:"冠名卡-57", image:["./Sponsored_Card_Template/57.jpg"], color:"#C8472B"},
      {code:"冠名卡-56", image:["./Sponsored_Card_Template/56.jpg"], color:"#C8472B"},
      {code:"冠名卡-55", image:["./Sponsored_Card_Template/55.jpg"], color:"#C8472B"},
      {code:"冠名卡-54", image:["./Sponsored_Card_Template/54.jpg"], color:"#C8472B"},
      {code:"冠名卡-53", image:["./Sponsored_Card_Template/53.jpg"], color:"#C8472B"},
      {code:"冠名卡-52", image:["./Sponsored_Card_Template/52.jpg"], color:"#C8472B"},
      {code:"冠名卡-51", image:["./Sponsored_Card_Template/51.jpg"], color:"#C8472B"},
      {code:"冠名卡-50", image:["./Sponsored_Card_Template/50.jpg"], color:"#C8472B"},
      {code:"冠名卡-49", image:["./Sponsored_Card_Template/49.jpg"], color:"#C8472B"},
      {code:"冠名卡-48", image:["./Sponsored_Card_Template/48.jpg"], color:"#C8472B"},
      {code:"冠名卡-47", image:["./Sponsored_Card_Template/47.jpg"], color:"#C8472B"},
      {code:"冠名卡-46", image:["./Sponsored_Card_Template/46.jpg"], color:"#C8472B"},
      {code:"冠名卡-45", image:["./Sponsored_Card_Template/45.jpg"], color:"#C8472B"},
      {code:"冠名卡-44", image:["./Sponsored_Card_Template/44.jpg"], color:"#C8472B"},
      {code:"冠名卡-43", image:["./Sponsored_Card_Template/43.jpg"], color:"#C8472B"},
      {code:"冠名卡-42", image:["./Sponsored_Card_Template/42.jpg"], color:"#C8472B"},
      {code:"冠名卡-41", image:["./Sponsored_Card_Template/41.jpg"], color:"#C8472B"},
      {code:"冠名卡-40", image:["./Sponsored_Card_Template/40.jpg"], color:"#C8472B"},
      {code:"冠名卡-39", image:["./Sponsored_Card_Template/39.jpg"], color:"#C8472B"},
      {code:"冠名卡-38", image:["./Sponsored_Card_Template/38.jpg"], color:"#C8472B"},
      {code:"冠名卡-37", image:["./Sponsored_Card_Template/37.jpg"], color:"#C8472B"},
      {code:"冠名卡-36", image:["./Sponsored_Card_Template/36.jpg"], color:"#C8472B"},
      {code:"冠名卡-35", image:["./Sponsored_Card_Template/35.jpg"], color:"#C8472B"},
      {code:"冠名卡-34", image:["./Sponsored_Card_Template/34.jpg"], color:"#C8472B"},
      {code:"冠名卡-33", image:["./Sponsored_Card_Template/33.jpg"], color:"#C8472B"},
      {code:"冠名卡-32", image:["./Sponsored_Card_Template/32.jpg"], color:"#C8472B"},
      {code:"冠名卡-31", image:["./Sponsored_Card_Template/31.jpg"], color:"#C8472B"},
      {code:"冠名卡-30", image:["./Sponsored_Card_Template/30.jpg"], color:"#C8472B"},
      {code:"冠名卡-29", image:["./Sponsored_Card_Template/29.jpg"], color:"#C8472B"},
      {code:"冠名卡-28", image:["./Sponsored_Card_Template/28.jpg"], color:"#C8472B"},
      {code:"冠名卡-27", image:["./Sponsored_Card_Template/27.jpg"], color:"#C8472B"},
      {code:"冠名卡-26", image:["./Sponsored_Card_Template/26.jpg"], color:"#C8472B"},
      {code:"冠名卡-25", image:["./Sponsored_Card_Template/25.jpg"], color:"#C8472B"},
      {code:"冠名卡-24", image:["./Sponsored_Card_Template/24.jpg"], color:"#C8472B"},
      {code:"冠名卡-23", image:["./Sponsored_Card_Template/23.jpg"], color:"#C8472B"},
      {code:"冠名卡-22", image:["./Sponsored_Card_Template/22.jpg"], color:"#C8472B"},
      {code:"冠名卡-21", image:["./Sponsored_Card_Template/21.jpg"], color:"#C8472B"},
      {code:"冠名卡-20", image:["./Sponsored_Card_Template/20.jpg"], color:"#C8472B"},
      {code:"冠名卡-19", image:["./Sponsored_Card_Template/19.jpg"], color:"#C8472B"},
      {code:"冠名卡-18", image:["./Sponsored_Card_Template/18.jpg"], color:"#C8472B"},
      {code:"冠名卡-17", image:["./Sponsored_Card_Template/17.jpg"], color:"#C8472B"},
      {code:"冠名卡-16", image:["./Sponsored_Card_Template/16.jpg"], color:"#C8472B"},
      {code:"冠名卡-15", image:["./Sponsored_Card_Template/15.jpg"], color:"#C8472B"},
      {code:"冠名卡-14", image:["./Sponsored_Card_Template/14.jpg"], color:"#C8472B"},
      {code:"冠名卡-13", image:["./Sponsored_Card_Template/13.jpg"], color:"#C8472B"},
      {code:"冠名卡-12", image:["./Sponsored_Card_Template/12.jpg"], color:"#C8472B"},
      {code:"冠名卡-11", image:["./Sponsored_Card_Template/11.jpg"], color:"#C8472B"},
      {code:"冠名卡-10", image:["./Sponsored_Card_Template/10.jpg"], color:"#C8472B"},
      {code:"冠名卡-9", image:["./Sponsored_Card_Template/9.jpg"], color:"#C8472B"},
      {code:"冠名卡-8", image:["./Sponsored_Card_Template/8.jpg"], color:"#C8472B"},
      {code:"冠名卡-7", image:["./Sponsored_Card_Template/7.jpg"], color:"#C8472B"},
      {code:"冠名卡-6", image:["./Sponsored_Card_Template/6.jpg"], color:"#C8472B"},
      {code:"冠名卡-5", image:["./Sponsored_Card_Template/5.jpg"], color:"#C8472B"},
      {code:"冠名卡-4", image:["./Sponsored_Card_Template/4.jpg"], color:"#C8472B"},
      {code:"冠名卡-3", image:["./Sponsored_Card_Template/3.jpg"], color:"#C8472B"},
      {code:"冠名卡-2", image:["./Sponsored_Card_Template/2.jpg"], color:"#C8472B"},
      {code:"冠名卡-1", image:["./Sponsored_Card_Template/1.jpg"], color:"#C8472B"}
    ]
  },
  {
    key:"Sister_Card",
    name:"闺蜜卡",
    image:"./敬请期待.jpg",
    items:[
      {code:"GMF-001", image:["./敬请期待.jpg"], color:"#2B3A67", ratio:"16/9"} /* ratio 可以控制特别款海报为 16:9 比例 */
    ]
  },
  {
    key:"Brother_Card",
    name:"兄弟卡",
    image:"./敬请期待.jpg",
    items:[
      {code:"XDK-001", image:["./敬请期待.jpg"], color:"#6E3B5C"}
    ]
  },
  {
    key:"Sponsored_Wall",
    name:"冠名墙",
    image:"./敬请期待.jpg",
    items:[
      {code:"GMW-001", image:["./敬请期待.jpg"], color:"#9C6B30"}
    ]
  },
  {
    key:"Upgrade_Crown",
    name:"升级冠",
    image:"./敬请期待.jpg",
    items:[
      {code:"UPG-001", image:["./敬请期待.jpg"], color:"#9C6B30"}
    ]
  },
  {
    key:"Playlist",
    name:"歌单模板",
    image:"./敬请期待.jpg",
    items:[
      {code:"TPL-001", image:["./敬请期待.jpg"], color:"#2B3A67"}
    ]
  },
  {
    key:"Auction",
    name:"拍卖模板",
    image:"./敬请期待.jpg",
    items:[
      {code:"AUC-001", image:["./敬请期待.jpg"], color:"#9C6B30"}
    ]
  },
  {
    key:"Benefits",
    name:"福利模板",
    image:"./敬请期待.jpg",
    items:[
      {code:"WEL-001", image:["./敬请期待.jpg"], color:"#2B3A67"}
    ]
  },
  {
    key:"Room_Background",
    name:"厅背景图",
    image:"./敬请期待.jpg",
    items:[
      {code:"RBG-001", image:["./敬请期待.jpg"], color:"#9C6B30"}
    ]
  },
  {
    key:"Live_Cover",
    name:"直播封面",
    image:"./敬请期待.jpg",
    items:[
      {code:"COV-001", image:["./敬请期待.jpg"], color:"#2B3A67"}
    ]
  },
  {
    key:"Room_Profile",
    name:"厅头模板",
    image:"./敬请期待.jpg",
    items:[
      {code:"RHD-001", image:[""], color:"#9C6B30"}
    ]
  },
  {
    key:"Team_Profile",
    name:"团头/厅头",
    image:"./敬请期待.jpg",
    items:[
      {code:"THD-001", image:[""], color:"#2B3A67"}
    ]
  }
];
