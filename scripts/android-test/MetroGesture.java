// Test-only shell driver. Injects real Android multi-pointer MotionEvents.
// Not part of the application or its APK. Use exclusively on emulator-5556.
import android.os.SystemClock;
import android.view.InputDevice;
import android.view.MotionEvent;
import java.lang.reflect.Method;
public class MetroGesture {
  static Object manager;
  static Method inject;
  static void send(long down, int action, float x1, float y1, float x2, float y2, int count) throws Exception {
    MotionEvent.PointerProperties[] props=new MotionEvent.PointerProperties[count];
    MotionEvent.PointerCoords[] coords=new MotionEvent.PointerCoords[count];
    for(int i=0;i<count;i++) { props[i]=new MotionEvent.PointerProperties();props[i].id=i;props[i].toolType=MotionEvent.TOOL_TYPE_FINGER;coords[i]=new MotionEvent.PointerCoords();coords[i].x=i==0?x1:x2;coords[i].y=i==0?y1:y2;coords[i].pressure=1;coords[i].size=1; }
    MotionEvent event=MotionEvent.obtain(down,SystemClock.uptimeMillis(),action,count,props,coords,0,0,1,1,0,0,InputDevice.SOURCE_TOUCHSCREEN,0);
    if(!(Boolean)inject.invoke(manager,event,2)) throw new Exception("Input injection failed");
    event.recycle();
  }
  public static void main(String[] args) throws Exception {
    Class<?> cls=Class.forName("android.hardware.input.InputManagerGlobal");manager=cls.getDeclaredMethod("getInstance").invoke(null);
    inject=cls.getDeclaredMethod("injectInputEvent",Class.forName("android.view.InputEvent"),int.class);
    float cx=Float.parseFloat(args[0]),cy=Float.parseFloat(args[1]),start=Float.parseFloat(args[2]),end=Float.parseFloat(args[3]);
    long down=SystemClock.uptimeMillis();send(down,MotionEvent.ACTION_DOWN,cx-start,cy,0,0,1);
    send(down,MotionEvent.ACTION_POINTER_DOWN|(1<<MotionEvent.ACTION_POINTER_INDEX_SHIFT),cx-start,cy,cx+start,cy,2);
    for(int i=1;i<=30;i++){float gap=start+(end-start)*i/30;send(down,MotionEvent.ACTION_MOVE,cx-gap,cy,cx+gap,cy,2);SystemClock.sleep(16);}
    send(down,MotionEvent.ACTION_POINTER_UP|(1<<MotionEvent.ACTION_POINTER_INDEX_SHIFT),cx-end,cy,cx+end,cy,2);
    send(down,MotionEvent.ACTION_UP,cx-end,cy,0,0,1);System.out.println("Native pinch injected: "+start+" -> "+end);
  }
}
