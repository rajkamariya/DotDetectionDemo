import { Component, ElementRef, NgZone, OnInit, ViewChild } from '@angular/core';
import { NgxOpenCVService, OpenCVState } from 'ngx-opencv';
// import cv from 'opencv-ts';
declare var cv: any; 

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent implements OnInit{
    
  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>; 
  @ViewChild('canvasTest', { static: true })
  canvasTest: ElementRef<HTMLCanvasElement>; 
  @ViewChild('video') videoEle: ElementRef<any>;
  @ViewChild('circleTooltip') circleText:ElementRef<any>;
  @ViewChild('circlePopup') circlePopup:ElementRef<any>;
  isPopup = false;
  context;
  cvState: string;
  detectionType = "Dot";//Dot,Circle
  examType:string = '';
  // circleMessage:string = 'Please place circular gauze into the middle of your camera view';
  defualtMessageTimeout;
  showDefaultMessage:boolean = true;

  constructor(private ngZone:NgZone,private ngxOpenCv: NgxOpenCVService){
    
  }

  ngOnInit(){
    console.log(this.videoEle)
    console.log(this.cvState)
    this.ngxOpenCv.cvState.subscribe(
	    (cvState: OpenCVState) => {
      if(cvState.ready){
        this.initRecording();
      }
    });
  }

  initRecording(){
    navigator.mediaDevices.getUserMedia({video:{facingMode:'environment'}}).then(stream=>{
      console.log(stream);
      this.videoEle.nativeElement.srcObject = stream;
      this.context = this.canvas.nativeElement.getContext("2d")
    this.context.drawImage(this.videoEle.nativeElement, 0, 0, 640, 480);
      switch(this.detectionType){
        case 'Circle':
            setInterval(()=>{
              if(this.videoEle.nativeElement.videoHeight>0){
                // this.circleDetection();
              }
            },0)
            
          break;
        case 'Dot':
          setInterval(()=>{  
          // setTimeout(()=>{ 
          if(this.videoEle.nativeElement.videoHeight>0){
              this.dotDetection();
            // }},2000)
          }
          },0); 
          break;
        default:
          
          setInterval(()=>{
            if(this.videoEle.nativeElement.videoHeight>0){
            this.animate();
            }
          },0)
          
          break;
      }
      
    })
  } 
  dotDetection(){
     // Do stuff
    let videoHeight = this.videoEle.nativeElement.videoHeight;
    let videoWidth = this.videoEle.nativeElement.videoWidth;
    let videoOffset = this.videoEle.nativeElement.offsetHeight;
    
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.videoHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.videoWidth;
    let src = new cv.Mat(this.videoEle.nativeElement.videoHeight,this.videoEle.nativeElement.videoWidth,cv.CV_8UC4)
    let cap = new cv.VideoCapture(this.videoEle.nativeElement);
    cap.read(src);
    

    this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
    let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
    let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
    dstcap.read(dst);
    
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    let msize = new cv.Size(3, 3);
    // let anchor = new cv.Point(-1, -1);
        
    // cv.blur(src,src,ksize,anchor,) 
    cv.GaussianBlur(src,src,msize,0)
    cv.medianBlur(src,src,3) 

    // cv.threshold(src,src,90,300,cv.THRESH_BINARY|cv.THRESH_OTSU);
    // cv.adaptiveThreshold(src, src, 100, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY_INV, 3, 1);
    cv.Canny(src, src, 30, 100, 3, false);    
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();

    let redColor = new cv.Scalar(255, 0, 0, 255);
    let greenColor = new cv.Scalar(0, 255, 0, 255);

    cv.findContours(src,contours,hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)
    
    // cv.drawContours(dst,contours,-1, redColor, 1, 8, hierarchy, 1);

    let dots =[];
    for (let i = 0; i < contours.size(); ++i) {
      let tmp = new cv.Mat();
      let cnt = contours.get(i);
      // cv.approxPolyDP(cnt,tmp,contours.size()*0.05,true)
      cv.convexHull(cnt, tmp, false, true);
      if(tmp.total()>8){
        let circle = cv.minEnclosingCircle(cnt);
        let circleArea = (3.14*circle.radius*circle.radius)-((3.14*circle.radius*circle.radius)*28/100);
        // let circleArea = (3.14*circle.radius*circle.radius)-50;        
        if(circleArea>0){
          
          // console.log(3.14*circle.radius*circle.radius)

          if(cv.contourArea(tmp)>circleArea)
          {
            // console.log(cv.contourArea(tmp))
            // console.log(circleArea)  
            // console.log(circle.radius);
            // console.log(3.14*circle.radius*circle.radius)

            if(circle.radius<25){
              circle.center.x =Math.round(circle.center.x * videoOffset/videoHeight);
              circle.center.y =Math.round(circle.center.y * videoOffset/videoHeight); 
              circle.radius =Math.round(circle.radius * videoOffset/videoHeight);
              let leftEdge = this.videoEle.nativeElement.offsetWidth*10/100;
              let rightEdge = this.videoEle.nativeElement.offsetWidth*90/100;
              let topEdge = this.videoEle.nativeElement.offsetHeight*10/100;
              let bottomEdge = this.videoEle.nativeElement.offsetHeight*80/100;
              let circleLeftX = circle.center.x-circle.radius;
              let circleRightX = circle.center.x+circle.radius;
              let circleTopY = circle.center.y-circle.radius;
              let circleBottomY = circle.center.y+circle.radius;
              if(circleLeftX > leftEdge && circleRightX < rightEdge && circleTopY > topEdge && circleBottomY < bottomEdge){
                let isDot = true;
                for(let i=0;i<dots.length;i++){
                  if(circle.center.x > (dots[i].center.x-2) && circle.center.x < (dots[i].center.x+2))
                  {
                    isDot = false;
                  }
                }
                if(isDot)
                {
                  dots.push({center:circle.center,radius:circle.radius});
                }
              }
              // cv.circle(dst, circle.center, circle.radius,greenColor);
            }
          }
        }
      }
      cnt.delete(); 
      tmp.delete();
    }
    // console.log(dots)
    // if(dots.length >1 ){
    //   // dots.forEach((d) => {
    //   //   console.log(d)
    //   //   // console.log(`${c} - ${index} - ${chars.indexOf(c)}`);
    //   // });
    //   // dots = dots.filter((data,index)=>{
    //   //   return dots.indexOf(data) === index;
    //   // })
    //   let color =greenColor; 
    //   // for(let i=0;i<dots.length;i++){
    //     for(let j=0;j<dots.length;j++){
    //       if(dots[j].center.y>(dots[0].center.y+15) || dots[j].center.y<(dots[0].center.y-15)){
    //         color = redColor;
    //         break;
    //       }
    //       // }else{
    //       //   color = redColor;
    //       // }
    //     // }
    //     //   if()
    //     // let center = new cv.Point(Math.round(dots[i].center.x),Math.round(dots[i].center.y))
    //           // cv.circle(dst, dots[i].center, dots[i].radius,greenColor);
    //   }
    //   for(let i=0;i<dots.length;i++){
    //     cv.circle(dst, dots[i].center, dots[i].radius,color);
    //   }
    // }
    if(dots.length <= 1){
      this.circlePopup.nativeElement.style.visibility = "visible";
      if(this.showDefaultMessage){  
        this.circlePopup.nativeElement.style.color = "red";
        this.circlePopup.nativeElement.innerHTML = "Please place penrose drain into the middle of your camera view";
      }
    }else if(dots.length > 1){
      this.showDefaultMessage = false;
      if(this.defualtMessageTimeout){
        clearTimeout(this.defualtMessageTimeout);
      }
      this.defualtMessageTimeout=setTimeout(()=>{
        this.showDefaultMessage = true;
      },2000);
      let color =greenColor; 
      // for(let j=1;j<dots.length;j++){
      //   if(dots[j].center.y>(dots[0].center.y+15) || dots[j].center.y<(dots[0].center.y-15)){
      //     color = redColor;
      //     break;
      //   }
      // }
      if(dots[1].center.y<(dots[0].center.y+20) && dots[1].center.y>(dots[0].center.y-20)){
        color = greenColor;
      }else{
        color = redColor
      }
      for(let i=0;i<dots.length;i++){
        cv.circle(dst, dots[i].center, dots[i].radius,color);
      }
      if(color === greenColor){
          this.circlePopup.nativeElement.style.visibility = "visible";
          this.circlePopup.nativeElement.style.color = "green";
          let distance=Math.sqrt((dots[1].center.x - dots[0].center.x)**2 + (dots[1].center.y - dots[0].center.y)**2)
          
          if(distance<0){
            distance=Math.sqrt((dots[1].center.x - dots[0].center.x)**2 + (dots[1].center.y - dots[0].center.y)**2)
          }
          // To convert px into cm
          // distance = distance *0.0264583333;
          
          this.circlePopup.nativeElement.innerHTML = "Distance="+Math.round(distance)+"px Now start performing the suture task";
      }else{
        this.circlePopup.nativeElement.style.color = "red";
        this.circlePopup.nativeElement.innerHTML = "Please place penrose drain into the middle of your camera view";
      }
    }
    // console.log(dots)

    cv.imshow('canvas', dst);
    src.delete();
    dst.delete();
    contours.delete();
    hierarchy.delete();
  }
  // circleDetection(){
  //   let videoHeight = this.videoEle.nativeElement.videoHeight;
  //   let videoWidth = this.videoEle.nativeElement.videoWidth;
  //   let videoOffset = this.videoEle.nativeElement.offsetHeight;

  //   this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
  //   this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
  //   let src = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
  //   let srccap = new cv.VideoCapture(this.videoEle.nativeElement);
  //   srccap.read(src);

  //   this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
  //   this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
  //   let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
  //   let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
  //   dstcap.read(dst);


  //   cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
  //   let msize = new cv.Size(3, 3);
  //   cv.GaussianBlur(src,src,msize,0)
  //   cv.medianBlur(src,src,3) 

  //   cv.Canny(src, src, 10, 100, 3, false);    
  //   let contours = new cv.MatVector();
  //   let hierarchy = new cv.Mat();

  //   let redColor = new cv.Scalar(255, 0, 0, 255);
  //   let greenColor = new cv.Scalar(0, 255, 0, 255);

  //   cv.findContours(src,contours,hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  //   // cv.drawContours(dst,contours,-1, redColor, 1, 8, hierarchy, 1);
  //   let dots =[];
  //   for (let i = 0; i < contours.size(); ++i) {
  //     let tmp = new cv.Mat();
  //     let cnt = contours.get(i);
  //     cv.convexHull(cnt, tmp, false, true);
  //     if(tmp.total()>8){
  //       let circle = cv.minEnclosingCircle(cnt);
  //       let circleArea = (3.14*circle.radius*circle.radius)-((3.14*circle.radius*circle.radius)*25/100);
  //       if(circleArea>0){
  //         if(cv.contourArea(tmp)>circleArea)
  //         {
  //         // console.log(cv.contourArea(tmp),circleArea)

  //           if(circle.radius > 25){
  //             // circle.center.x =circle.center.x * videoOffset/videoHeight;
  //             // circle.center.y =circle.center.y * videoOffset/videoHeight 
  //             // circle.radius =circle.radius * videoOffset/videoHeight 
  //             dots.push(i);
  //             // cv.circle(dst, circle.center, circle.radius, redColor, 2);
  //           }
  //         }
  //       }
  //     }
      
  //     cnt.delete(); 
  //     tmp.delete();
  //   }
    
  //   if(dots.length === 0){
  //     this.circlePopup.nativeElement.style.visibility = "visible";
  //     if(this.showDefaultMessage){  
  //       this.circlePopup.nativeElement.style.color = "red";
  //       this.circlePopup.nativeElement.innerHTML = "Please place circular gauze into the middle of your camera view";
  //     }
  //   }else if(dots.length > 0){
  //     this.showDefaultMessage = false;
  //     if(this.defualtMessageTimeout){
  //       clearTimeout(this.defualtMessageTimeout);
  //     }
  //     this.defualtMessageTimeout=setTimeout(()=>{
  //       this.showDefaultMessage = true;
  //     },2000);
  //     console.log(dots);
      
  //     let cnt = contours.get(dots[0]);
  //     let circle = cv.minEnclosingCircle(cnt);
  //     this.examType = "Exam";
  //     // Double Circle Detected
  //     // for(let i =1;i<dots.length;i++){
  //     //   let newCircle = cv.minEnclosingCircle(contours.get(dots[i]));
  //     //   if(newCircle.radius > (circle.radius +10))
  //     //   {
  //     //     this.examType = "Practice"
  //     //     // cv.circle(dst, dots[i].center, dots[i].radius, color, 2);
  //     //     break;
  //     //   }
  //     // }
      
  //     // cv.drawContours(dst, contours, dots[0], redColor, 2, cv.LINE_8, hierarchy, 0);
  //     // cv.circle(dst, circle.center, circle.radius, redColor, 2);
  //     // let cnt2 = contours.get(dots[dots.length-1]);
  //     // let circle2 = cv.minEnclosingCircle(cnt2);
  //     // cv.circle(dst, circle2.center, circle2.radius, redColor, 2);
  //     // console.log(circle)
  //     // cv.drawContours(dst, contours, dots[0], redColor, 2, cv.LINE_8, hierarchy, 0);
  //     let color;
  //      if(circle.radius<45){
  //         this.circlePopup.nativeElement.style.visibility = "visible";
  //         this.circlePopup.nativeElement.style.color = "red";
  //         this.circlePopup.nativeElement.innerHTML = "Please bring the gauze closer to your camera view";
  //         color = redColor;
  //         cv.drawContours(dst, contours, dots[0], redColor, 2, cv.LINE_8, hierarchy, 0);
  //         // cv.drawContours(dst, contours, dots[0], redColor, 2, cv.LINE_8, hierarchy, 0);
  //       }else{
  //         let leftEdge = this.videoEle.nativeElement.offsetWidth*20/100;
  //         let rightEdge = this.videoEle.nativeElement.offsetWidth*80/100;
  //         let circleLeftX = circle.center.x-circle.radius;
  //         let circleRightX = circle.center.x+circle.radius;
          
  //         if(circleLeftX > leftEdge && circleRightX < rightEdge){
  //           this.circlePopup.nativeElement.style.visibility = "visible";
  //           this.circlePopup.nativeElement.style.color = "green";
  //           this.circlePopup.nativeElement.innerHTML = "Now start performing your "+this.examType.toLowerCase()+" circular cutting task";
  //           cv.drawContours(dst, contours, dots[0], greenColor, 2, cv.LINE_8, hierarchy, 0);
  //           // color = greenColor;
  //         }else{
  //           this.circlePopup.nativeElement.style.visibility = "visible";
  //           this.circlePopup.nativeElement.style.color = "red";
  //           this.circlePopup.nativeElement.innerHTML = "Please position your gauze in the middle of your camera view";
  //           cv.drawContours(dst, contours, dots[0], redColor, 2, cv.LINE_8, hierarchy, 0);
  //           // color = redColor;
  //         }
  //         // Single Circle Drawing
          
  //         // Double Circle Drawing
  //         // for(let i =1;i<dots.length;i++){
  //         //   let newCircle = cv.minEnclosingCircle(contours.get(dots[i]));
  //         //   if(newCircle.radius > (circle.radius +10))
  //         //   {
  //         //     // this.examType = "Practice"
  //         //     cv.drawContours(dst, contours, dots[i], color, 2, cv.LINE_8, hierarchy, 0);
  //         //     // cv.circle(dst, dots[i].center, dots[i].radius, color, 2);
  //         //     break;
  //         //   }
  //         // }
  //         // cv.drawContours(dst, contours, dots[dots.length-1], color, 2, cv.LINE_8, hierarchy, 0);
  //       }
        
  //   }


  //   cv.imshow('canvas', dst);
  //   src.delete();
  //   dst.delete();
  //   contours.delete();
  //   hierarchy.delete();
  // }
  animate() {
    let videoHeight = this.videoEle.nativeElement.videoHeight;
    let videoWidth = this.videoEle.nativeElement.videoWidth;
    let videoOffset = this.videoEle.nativeElement.offsetHeight;
    
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.videoHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.videoWidth;
    let src = new cv.Mat(this.videoEle.nativeElement.videoHeight,this.videoEle.nativeElement.videoWidth,cv.CV_8UC4)
    let cap = new cv.VideoCapture(this.videoEle.nativeElement);
    
    cap.read(src);
    
    //This
    this.videoEle.nativeElement.height = this.videoEle.nativeElement.offsetHeight;
    this.videoEle.nativeElement.width = this.videoEle.nativeElement.offsetWidth;
    let dst = new cv.Mat(this.videoEle.nativeElement.offsetHeight,this.videoEle.nativeElement.offsetWidth,cv.CV_8UC4)
    let dstcap = new cv.VideoCapture(this.videoEle.nativeElement);
    dstcap.read(dst);
    
    cv.cvtColor(src, src, cv.COLOR_RGBA2GRAY);
    let ksize = new cv.Size(3, 3);
        
    cv.GaussianBlur(src,src,ksize,0)
    cv.medianBlur(src,src,3) 
    
    let circles = new cv.Mat();

    let redColor = new cv.Scalar(255, 0, 0, 255);
    let greenColor = new cv.Scalar(0,255,0,255);  
    cv.HoughCircles(src,circles,cv.HOUGH_GRADIENT,1,100,85,85);
    if(circles.cols === 0){
      this.circlePopup.nativeElement.style.visibility = "visible";
      if(this.showDefaultMessage){  
        this.circlePopup.nativeElement.style.color = "red";
        this.circlePopup.nativeElement.innerHTML = "Please place circular gauze into the middle of your camera view";
      }
    }else if(circles.cols === 1){
      this.showDefaultMessage = false;
      if(this.defualtMessageTimeout){
        clearTimeout(this.defualtMessageTimeout);
      }
      this.defualtMessageTimeout=setTimeout(()=>{
        this.showDefaultMessage = true;
      },2000);
      this.examType = "Exam"
      for(let i = 0; i < circles.cols; ++i) {
        let x = (circles.data32F[i * 3]*videoOffset/videoHeight);
        let y = circles.data32F[i * 3 + 1]*videoOffset/videoHeight;
        let radius = (circles.data32F[i * 3 + 2]*videoOffset/videoHeight);
        let center = new cv.Point(x,y);
        let maxRadius = (60*videoOffset/videoHeight);
        if(radius<maxRadius){
          
          cv.circle(dst, center, radius, redColor,2);
          
          this.circlePopup.nativeElement.style.visibility = "visible";
          this.circlePopup.nativeElement.style.color = "red";
          this.circlePopup.nativeElement.innerHTML = "Please bring the gauze closer to your camera view";
        }else{
          let leftEdge = this.videoEle.nativeElement.offsetWidth*20/100;
          let rightEdge = this.videoEle.nativeElement.offsetWidth*80/100;
          let circleLeftX = x-radius;
          let circleRightX = x+radius;
          let color;
          if(circleLeftX > leftEdge && circleRightX < rightEdge){
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circlePopup.nativeElement.style.color = "green";
            this.circlePopup.nativeElement.innerHTML = "Now start performing your "+this.examType.toLowerCase()+" circular cutting task";
            color = greenColor;
          }else{
            this.circlePopup.nativeElement.style.visibility = "visible";
            this.circlePopup.nativeElement.style.color = "red";
            this.circlePopup.nativeElement.innerHTML = "Please position your gauze in the middle of your camera view";
            color = redColor;
          }
          cv.circle(dst, center, radius, color,2);
        }
        
      }
    }
    cv.imshow('canvas', dst);
    src.delete();
    dst.delete();
    circles.delete();
  }
}
