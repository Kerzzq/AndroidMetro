// Test-only shell driver; never bundled in AndroidMetro. Emulator-5556 only.
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import java.lang.reflect.Method;
public class MetroGesture {
  static Object manager; static Method inject;
  static void send(long down,int action,float x1,float y1,float x2,float y2,int count,int firstId) throws Exception {
    MotionEvent.PointerProperties[] props=new MotionEvent.PointerProperties[count];
    MotionEvent.PointerCoords[] coords=new MotionEvent.PointerCoords[count];
    for(int i=0;i<count;i++){props[i]=new MotionEvent.PointerProperties();props[i].id=count==1?firstId:i;props[i].toolType=MotionEvent.TOOL_TYPE_FINGER;coords[i]=new MotionEvent.PointerCoords();coords[i].x=i==0?x1:x2;coords[i].y=i==0?y1:y2;coords[i].pressure=1;coords[i].size=1;}
    MotionEvent event=MotionEvent.obtain(down,SystemClock.uptimeMillis(),action,count,props,coords,0,0,1,1,0,0,InputDevice.SOURCE_TOUCHSCREEN,0);
    if(!(Boolean)inject.invoke(manager,event,2))throw new Exception("Input injection failed");event.recycle();
  }
  static void capture(String name) throws Exception {
    SystemClock.sleep(180);
    Process p=new ProcessBuilder("/system/bin/screencap","-p","/sdcard/"+name+".png").start();
    if(p.waitFor()!=0)throw new Exception("Screenshot failed: "+name);
  }
  public static void main(String[] args) throws Exception {
    Class<?> cls=Class.forName("android.hardware.input.InputManagerGlobal");manager=cls.getDeclaredMethod("getInstance").invoke(null);inject=cls.getDeclaredMethod("injectInputEvent",Class.forName("android.view.InputEvent"),int.class);
    if(args[0].equals("drag")) {
      float x=Float.parseFloat(args[1]),y=Float.parseFloat(args[2]),ex=Float.parseFloat(args[3]),ey=Float.parseFloat(args[4]);
      long down=SystemClock.uptimeMillis();send(down,0,x,y,0,0,1,0);SystemClock.sleep(900);
      for(int i=1;i<=30;i++){send(down,2,x+(ex-x)*i/30,y+(ey-y)*i/30,0,0,1,0);SystemClock.sleep(16);}send(down,1,ex,ey,0,0,1,0);return;
    }
    float cx=Float.parseFloat(args[0]),cy=Float.parseFloat(args[1]),start=Float.parseFloat(args[2]),end=Float.parseFloat(args[3]);
    int lifted=args.length>4?Integer.parseInt(args[4]):1;String prefix=args.length>5?args[5]:"pinch";
    String mode=args.length>6?args[6]:"normal";
    float dx=args.length>7?Float.parseFloat(args[7]):0,dy=args.length>8?Float.parseFloat(args[8]):0;
    long down=SystemClock.uptimeMillis();send(down,0,cx-start,cy,0,0,1,0);
    if(mode.equals("pan-first")){for(int i=1;i<=12;i++){send(down,2,cx-start+i*2,cy,0,0,1,0);SystemClock.sleep(16);}}
    send(down,5|(1<<8),cx-start,cy,cx+start,cy,2,0);
    for(int i=1;i<=30;i++){float gap=start+(end-start)*i/30,x=cx+dx*i/30,y=cy+dy*i/30;send(down,2,x-gap,y,x+gap,y,2,0);SystemClock.sleep(16);}
    cx+=dx;cy+=dy;
    capture(prefix+"-dos");send(down,6|(lifted<<8),cx-end,cy,cx+end,cy,2,0);
    int remaining=1-lifted;float x=cx+(remaining==0?-end:end);
    // Android POINTER_UP still carries two pointers. Subsequent MOVE carries one.
    send(down,2,x,cy,0,0,1,remaining);SystemClock.sleep(350);capture(prefix+"-uno");
    send(down,mode.equals("cancel")?MotionEvent.ACTION_CANCEL:MotionEvent.ACTION_UP,x,cy,0,0,1,remaining);capture(prefix+"-cero");
    System.out.println("Native 2->1->"+(mode.equals("cancel")?"cancel":"0")+", lifted="+lifted+", gap="+start+"->"+end+", mode="+mode+", held >=350ms, screenshots="+prefix);
  }
}
