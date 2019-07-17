   let musicRender=(function(){
       //=>获取三个dom元素计算contentBox的高度
       let $headerBox=$('.headerBox'),
           $contentBox=$('.contentBox'),
           $footerBox=$('.footerBox'),
           $wrapper=$contentBox.find('.wrapper'),
           $lyricList=null,
           musicAudio=$('#musicAudio')[0],
           $playBtn=$headerBox.find('.playBtn'),
           $already=$footerBox.find('.already'),
           $duration=$footerBox.find('.duration'),
           $current=$footerBox.find('.current');
     /*  console.log($current);*/
       /*COMPUTERD-CONTEE NT-HEIGHHT:计算高度*/
       let computedContentHeight=function computedContentHeight() {
           let HTML=document.documentElement,
               winH=HTML.clientHeight,
               font=parseFloat(document.documentElement.style.fontSize);
               $contentBox.css({
                   height:winH-$headerBox[0].offsetHeight-$footerBox[0].offsetHeight-0.8*font
               });
       };
       /*QUERY-LYRIC:获取歌词*/
      let queryLyric=function queryLyric() {
            return new Promise(roslove=>{
             $.ajax({
                url:'json/lyric.json',
                method:'get',
                dataType:'json',
                async:true,
                success:roslove
            })
         });
      };
      /*FORM-AT-DATA:去掉歌词中特殊的内容*/
      let formAtData=function formatData(result) {
          let {lyric = ''} = result,
              obj = {32: ' ', 40: '(', 41: ')', 45: '-'};
          lyric = lyric.replace(/&#(\d+);/g, (...arg) => {
              let [item, num] = arg;
              item = obj[num] || item;
              return item;
          });
          $footerBox.lyric=lyric;
      };
      let  formATData1=function formATData1() {
          let lyric=$footerBox.lyric;
          lyric+='&#10;'//方便正则处理字符串的；
          let lyricAry=[],
              reg=/\[(\d+)&#58;(\d+)&#46;\d+\]([^&#]+)&#10;/g;
          lyric.replace(reg,(...arg)=>{
                 let [,minutes,seconds,content]=arg;
                 lyricAry.push({
                     minutes,
                     seconds,
                     content
                 });
             });
          $footerBox.lyricAry=lyricAry;
      };
      /*BING-HTML:绑定歌词*/
      let bindHTML=function bindHTML() {
          let lyricAry=$footerBox.lyricAry,
              str=``;
          lyricAry.forEach(item=>{
              let {minutes,seconds,content}=item;
              str+=`<p data-minutes="${minutes}" data-seconds="${seconds}">${content}</p>`;
          });
          $wrapper.html(str);
          $lyricList=$wrapper.find('p');
      };
      //=>开始播放
       let $plan=$.Callbacks();
       let playRun=function playRun(){
           musicAudio.play();
           musicAudio.addEventListener('canplay',$plan.fire)
       };
       //=>控制暂停播放
       $plan.add(()=>{
        $playBtn.css('display','block')
            .addClass('move');
        $playBtn.tap(()=>{
            if(musicAudio.paused){
                //=>是否为暂停状态：是暂停让其播放
                musicAudio.play();
                $playBtn.addClass('move');
                return;
            }
            //=>当前是播放，让其暂停
            musicAudio.pause();
            $playBtn.removeClass('move');

        })
       });

       //=>控制进度条
       let autoTimer=null;
       $plan.add(()=>{
           let duration=musicAudio.duration;
           $duration.html(computerTime(duration));
       //随时监听播放状态
           autoTimer=setInterval(()=>{
               let currentTime=musicAudio.currentTime;
               if(currentTime>=duration){
                   //=>播放完成
                   clearInterval(autoTimer);
                   $already.html(computerTime(duration));
                   $current.css('width','100%');
                   musicAudio.pause();
                   $playBtn.removeClass('move');
                   return;
               }
               $already.html(computerTime(currentTime));
               $current.css('width',(currentTime/duration)*100+'%');
               matchLyric(currentTime);
           },1000)



       });
       //=>匹配歌词实现歌词对应
       let translateY=0;
       let matchLyric=function matchLyric(currentTimer) {
           //=>matchLyric:已经播放的时间
           let [minutes,seconds]=computerTime(currentTimer).split(':');
           //=>在歌词集合中筛选出我们想要展示的
           let $cur=$lyricList.filter(`[data-minutes="${minutes}"]`).filter(`[data-seconds="${seconds}"]`);
           if($cur.length===0)return;
           if($cur.hasClass('active'))return;
           let index=$cur.index();
           $cur.addClass('active')
               .siblings().removeClass('active');
           if(index>=4){
               //=>已经超过四条歌词了，让对应一条都让wrapper向上移动一行
               let curH=$cur[0].offsetHeight;
               translateY-=curH;
               $wrapper.css('transform',`translateY(${translateY}px)`);
           }

       };
       /*计算时间的*/
       let computerTime=function computerTime(time) {
           //=>time:秒
           let minutes=Math.floor(time/60),
               seconds=Math.floor(time-minutes*60);
           minutes<10?minutes='0'+minutes:null;
           seconds<10?seconds='0'+seconds:null;
           return `${minutes}:${seconds}`;
       };
           return {
               init:function init(){
                   computedContentHeight();
                   let promise=queryLyric();
                   promise.then(result=>{
                       formAtData(result);
                   }).then((lric)=>{
                       formATData1();
                       bindHTML();
                       playRun();
                   });
               }
           };

       })();
   musicRender.init();
   // &#32; ->空格
   // &#40; ->(
   // &#41; ->)
   // &#45; ->-
   //
   // &#10; ->换行符
   // &#58; ->前面的数字是分钟
   // &#46; ->前面的数字是秒
