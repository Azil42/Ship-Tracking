#include <stdio.h>
#include <math.h>
#include <string.h>
#include <stdlib.h>
#include <unistd.h>
#include <arpa/inet.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <netdb.h>
#include <time.h>
#include <signal.h>


#define  SERV_TCP_PORT  2345  // Port number used
#define  SERV_HOST_ADDR "127.0.0.1"

double lat1 = -7.3; //LS posisi kita
double lon1 = 112.8;  //BT posisi kita
double REARTH = 6370;  //radius bumi dalam Km
double dpi = 0.017453;
double jarak();

//FILE *fp_ais;
//char dir_ais[100];

void sig_handler(int signo)
{
  if (signo == SIGINT){
    printf("\nAnda baru saja menekan ctrl-c\n");
    //    fclose(fp_ais);
    printf("\nFile AIS sudah disimpan...\n");
    exit(1);
  }
}

double power=0,volt=0;
int connect_to();

// =================================== AIS - decoder ===================================

int bits2int(char *bitstream, int from, int n)
 {
   unsigned int r = 0;
   for(int i=from; i<from+n; i++) { r<<=1;  if (bitstream[i>>3] & (1<<(7-i&7))) r|=1; }
   return r;
 }

char *bits2chars(char *r, char *bitstream, int from, int n)
 {
   for (int i=0; i<n/6; i++) { r[i] = bits2int(bitstream, from + i*6, 6);  if (r[i]<32) r[i]+=64; }
   r[n/6] = 0;
   return r;
 }

int sgn_lon(int x) { return (x&(1<<27)) ? (x-(1<<28)) : x; }  // extract sign -W +E 
int sgn_lat(int x) { return (x&(1<<26)) ? (x-(1<<27)) : x; }  // extract sign -S +N 

void parse_AIS_message(char *p)
 {

   time_t t = time(NULL);
   struct tm tm = *localtime(&t);

   t = time(NULL);
   tm = *localtime(&t);

   int lat, lon;  // Geographical position
   double lat2,lon2,dist;

   int mmid = bits2int(p, 0, 6);   printf(" %2d ", mmid); //fprintf(fp_ais," %2d ", mmid);
   int mmsi = bits2int(p, 8, 30);  printf(" %9d ", mmsi); //fprintf(fp_ais," %9d ", mmsi); 
   char csgn[16], name[32], dest[32]; // Static and voyage related vessel data

   switch(mmid)   
     {
      case 1: case 2: case 3:  lon = sgn_lon(bits2int(p, 61, 28));   // Shipborne mobile equipment
                               lat = sgn_lat(bits2int(p, 89, 27));
 
			       lon2=(double)lon/600000; lat2=(double)lat/600000;
   dist=jarak(lat2,lon2);
              printf(" %11.6lf %11.6lf ", (double)lon/600000, (double)lat/600000);
	      //              fprintf(fp_ais," %11.6lf %11.6lf ", (double)lon/600000, (double)lat/600000);
              printf(" %3.0lf km/h   %5.1lf  %d_%d_%d    %.2lf    %.2lf\n", 0.1852*bits2int(p, 50, 10), (double)bits2int(p, 116, 12)/10,tm.tm_hour, tm.tm_min, tm.tm_sec,volt,dist);
	      //              fprintf(fp_ais," %3.0lf km/h   %5.1lf    %d_%d_%d_%d_%d_%d\n", 0.1852*bits2int(p, 50, 10), (double)bits2int(p, 116, 12)/10,tm.tm_year+1900, tm.tm_mon + 1, tm.tm_mday, tm.tm_hour, tm.tm_min, tm.tm_sec);
	      break;

      case 4: lon = sgn_lon(bits2int(p,  79, 28));   // Base station
              lat = sgn_lat(bits2int(p, 107, 27));
 
              printf(" %11.6lf %11.6lf ", (double)lon/600000, (double)lat/600000);
	      //              fprintf(fp_ais," %11.6lf %11.6lf ", (double)lon/600000, (double)lat/600000);

              printf(" %d/%d/%d ", bits2int(p, 38, 14), bits2int(p, 52, 4), bits2int(p, 56, 5));  // date
	      //              fprintf(fp_ais," %d/%d/%d ", bits2int(p, 38, 14), bits2int(p, 52, 4), bits2int(p, 56, 5));  // date
	      printf(" %02d:%02d:%02d \n", bits2int(p, 61, 5), bits2int(p, 66, 6), bits2int(p, 72, 6));  // time
	      break;

     case 5: printf(" %s << %s >> %s  %d_%d_%d\n", bits2chars(csgn, p, 70, 42),\
		    bits2chars(name, p, 112, 120),bits2chars(dest, p, 302, 120),\
		    tm.tm_hour, tm.tm_min, tm.tm_sec);
       //       fprintf(fp_ais," %s << %s >> %s  %d_%d_%d\n", bits2chars(csgn, p, 70, 42), \
		    bits2chars(name, p, 112, 120),bits2chars(dest, p, 302, 120),\
		    tm.tm_hour, tm.tm_min, tm.tm_sec);


	break;

     default: printf(" Unknown message ID\n");
       //       fprintf(fp_ais," Unknown message ID\n");       
       break;
     }
 }

unsigned short crc16(char *buff, int n)  // Frame Check Sequence, CRC-16-CCITT (0xFFFF)
 {	
   unsigned short crc = 0xFFFF;
   for(int i=0; i<n; i++)
    { unsigned char data = buff[i];  data ^= crc & 0xff;  data ^= data << 4;
      crc = ((data<<8) | (crc>>8)) ^ (data>>4) ^ (data<<3); }
   return ~crc;
 }

#define PL 32  // HDLC synchronisation pattern legnth

int AIS_decode(int n, int rate, int *sA, int *sF, int i)
 {
   int u, j, k=0,ii; 

   // find 100 consecutive samples with amplitude >= 4 
   for(; i<n; i++) {
     if (sA[i] < 4*4) k=0;
     else if (++k>=100){
       break;
     }
   }


   i -= k;
   if (i > n-500) return i;  // End of buffer
   int pattern[PL] = {  1,1,0,0,1,1,0,0,  1,1,0,0,1,1,0,0,  1,1,0,0,1,1,0,0,  1,1,1,1,1,1,1,0  };  // NRZI
                    //  0 1 0 1 0 1 0 1   0 1 0 1 0 1 0 1   0 1 0 1 0 1 0 1   0 1 1 1 1 1 1 0  // preamble and 0x7E

   for(j=0; j<PL; j++) if (pattern[j]==0) pattern[j] =  1; 
                                     else pattern[j] = -1;
   int smax=0, imax=0;
   double T = ((double)rate) / 9600.0;  // GMSK - 9600 Bd

   for(k=0; k<20*T; k++)  // find maximal correlation with pattern on interval <0,20*T> (i.e. synchronisation)
    {
      int s=0;
      for(j=0; j<PL; j++) {  int s0 = pattern[j] * sF[i+k+(int)(j*T+0.5)];   if (s0 < 0.0) break;   s+=s0; }
      if (j==PL && s>smax) { smax=s; imax=k; }
    }

   if (smax==0)  
   for(k=0; k<20*T; k++)  // try opposite polarisation
    {
      int s=0;
      for(j=0; j<PL; j++) { int s0 = pattern[j] * sF[i+k+(int)(j*T+0.5)];   if (s0 > 0.0) break;   s+=s0; }
      if (j==PL && s<smax) { smax=s; imax=k; }
    }

   if (smax==0) return i + 220*T;  // HDLC Synch not found

   i += imax;  // move to the beginning of AIS frame
 
   u = k = 0;
   unsigned char msg[256];  msg[0] = 0; 
   unsigned char out, old_bit = 99, bit;
   char o1,o2,o3,o4,o5;  o1=o2=o3=o4=o5=0; 
   int cuplik=0;


   /* --- proses dekone HDLC --- */
   power=0;
   for(j=0; j<(n-i)/T; j++)  
    {
      /*
      if (sA[i+(int)(j*T+0.5)] > 2*2){ // AIS signal
	p[cuplik]= sA[i+(int)(j*T+0.5)];
	printf("p[%d]= %f\n",cuplik,p[cuplik]);
	cuplik++;
      }
      */

      if (sA[i+(int)(j*T+0.5)] < 2*2) break;  // weak signal
      power=power+((double)sA[i+(int)(j*T+0.5)]);
      

       bit = (sF[i+(int)(j*T+0.5)] > 0) ? 0 : 1; 

       out = (bit != old_bit) ? 0 : 1;  // NRZI decoding (change=0, no change=1)
       old_bit = bit; 

       // bit-stuffing: if 6 consecutive one's then zero is inserted because of flag 0x7E distinguishing => skip zero
       if (o1==1 && o2==1 && o3==1 && o4==1 && o5==1) { o1=o2=o3=o4=o5=0;  if (out==0) continue; }
       o5=o4; o4=o3; o3=o2; o2=o1; o1=out;

       if (out==1) msg[u] |= 1<<k;  // bits to byte (LSF)

       if (++k == 8) { k=0;  u++;  msg[u]=0; }
    }
   /* ----------------------------------*/


   power=power/(double)j;
   volt=sqrt(power);
   volt=20*log10(volt);
   //   printf("fieldstrength candidate slot = %.2lf dB\n",volt);

   /* --- CRC check :   */
   int msgID = bits2int(&msg[4], 0, 6);
   int msglen = (msgID == 5) ? 53 : 21;  // Message 5 is 424 bits long

   int crc0 = *((unsigned short *)&msg[msglen+4]);  
   int crc  = crc16(&msg[4], msglen);

   if (crc == crc0) parse_AIS_message(&msg[4]);

   return i + j*T;
 }

// ================================= Tuning, Filtering, Demodulation =====================================

#define NIQ 300000  // 1 buf per second

#define FL 31  // FIR coeffs multiplied by factor 2^20

int h3[FL] = { 349525, 288373, 143167, 0, -69570, -54470, 0, 36711, 30962, 0, -22642, -19513, 0, 14571, 12587, 0, -9335, -7997, 0, 5785, 4877, 0, -3395, -2804, 0, 1878, 1532, 0, -1044, -891, 0 };  // 1/3 band
int h8[FL] = { 131072, 127428, 116895, 100620, 80332, 58108, 36092, 16222, 0, -11660, -18487, -20817, -19463, -15544, -10278, -4797, 0, 3534, 5569, 6171, 5631, 4356, 2772, 1239, 0, -830, -1251, -1339, -1205, -951, -648 };  // 1/8 band (6.25 kHz)

static inline int fir_sample(int *x, int n, int h[])
 {
   int s = h[0]*x[n-1];
   for(int i=1; i<n; i++) s += h[i] * (x[n-i-1] + x[n+i-1]);
   return s >> 19;
 }

void proces_buff(int n, unsigned char *buff)

 {
   int i, rate = 300000;
   static int I1[NIQ], Q1[NIQ], I2[NIQ/3], Q2[NIQ/3]; 

   //sampling 300K
   for(i=0; i<n; i++) {
     I1[i] = buff[2*i]   - 128;  //sampel genab untuk i
     Q1[i] = buff[2*i+1] - 128;  //sampel gasal untuk q

     //     printf("I1[%d]= %d; Q1[%d]= %d\n", i,I1[i],i,Q1[i]);   
   }

   n /=3;  rate /= 3;  // originally intended for 100 kHz sampling rate, but RTL doesn't support it

   //desimasi 1/3 menjadi  sampling 100K
   for(i=0; i<n-10; i++) { I1[i] = fir_sample(&I1[3*i], FL, h3);  // third-sampling with anti-aliasing
                           Q1[i] = fir_sample(&Q1[3*i], FL, h3); }

   //kemungkinan kanal 1 atau kanal 2
   for(i=0; i<n; i+=4)  // split I/Q stream into AIS channels 1 & 2
    {
      I2[i+0] =  I1[i+0];  Q2[i+0] =  Q1[i+0];  // shift stream by 25 kHz (PI/2) to channel 2
      I2[i+1] =  Q1[i+1];  Q2[i+1] = -I1[i+1]; 
      I2[i+2] = -I1[i+2];  Q2[i+2] = -Q1[i+2];
      I2[i+3] = -Q1[i+3];  Q2[i+3] =  I1[i+3];

      I1[i+1] = -I2[i+1];  Q1[i+1] = -Q2[i+1];  // shift it back by 50 kHz (PI) to channel 1
      I1[i+2] =  I2[i+2];  Q1[i+2] =  Q2[i+2];
      I1[i+3] = -I2[i+3];  Q1[i+3] = -Q2[i+3];  
    }

#define DCM 2  // works fine also with DCM 1, 3

   n /= DCM;   rate /= DCM;

   // Desimasi 1/2 menjadi sampling 50KHz dan lowpass 6.25 KHz
   for(i=0; i<n-15; i++) { I1[i] = fir_sample(&I1[DCM*i], FL, h8);  // half-sampling with low-pass 6.25 kHz
                           Q1[i] = fir_sample(&Q1[DCM*i], FL, h8); 
                           I2[i] = fir_sample(&I2[DCM*i], FL, h8);  
                           Q2[i] = fir_sample(&Q2[DCM*i], FL, h8); }

   for(i=0; i<n-1; i++) {  Q1[i] = Q1[i+1]*I1[i+0] - Q1[i+0]*I1[i+1];  // FM demodulation
                           Q2[i] = Q2[i+1]*I2[i+0] - Q2[i+0]*I2[i+1];  
                           I1[i] = I1[i+1]*I1[i+1] + Q1[i+1]*Q1[i+1];  // AM demodulation
                           I2[i] = I2[i+1]*I2[i+1] + Q2[i+1]*Q2[i+1]; }


   i=0;   while (i<n-500) i = AIS_decode(n, rate, I1, Q1, i);  // Channel 1
   i=0;   while (i<n-500) i = AIS_decode(n, rate, I2, Q2, i);  // Channel 2

   fflush(stdout);
 }

// =========================================== IQ data from socket ==========================================

int tcp_recv() 
{

  int         sockfd;        // Server socket descriptor
  struct sockaddr_in   serv_addr;     // Server Internet address
  int                  addr_len;        // Internet address length
  char                 out_buf[100];    // 100-byte buffer for output data
  char                 in_buf[2*NIQ];     // 300000-byte buffer for input data


    // Fill-in server1 socket's address information
  bzero((char *) &serv_addr, sizeof(serv_addr));
  serv_addr.sin_family      = AF_INET;            // Address family to use
  serv_addr.sin_port        = htons(SERV_TCP_PORT);    // Port num to use
  serv_addr.sin_addr.s_addr = inet_addr(SERV_HOST_ADDR); // IP address to use

  char *alamat;
  unsigned int lapak;  

  if((sockfd = socket(AF_INET, SOCK_STREAM, 0))<0){
    printf("client: gagal buka soket stream\n\n");
    exit(-1);
  }

  if(connect(sockfd, (struct sockaddr *) &serv_addr, sizeof(serv_addr))<0){
    printf("client: gagal sambung ke server\n");
    exit(-1);
  }
  
  //  alamat=inet_ntoa(serv_addr.sin_addr.s_addr);
  alamat=inet_ntoa(serv_addr.sin_addr);
     lapak=ntohs(serv_addr.sin_port);

     printf("\nport: %d; alamat: %s \n",lapak,alamat);


  ssize_t n;
  if ((n=recv(sockfd, in_buf, 2*NIQ, 0)) > 0) printf("\n === (%d bytes) %s === \n\n", n, in_buf);  // initial packet

  printf(" MID    MMSI      longitude   latitude     speed    course  waktu  f_str(dB)  Jarak(Km)\n");
  //  fprintf(fp_ais," MID    MMSI      longitude   latitude     speed    course     waktu\n");
  printf("-------------------------------------------------------------------------------------------\n");
  //  fprintf(fp_ais,"-------------------------------------------------------------------------------------------\n");
  while((n=recv(sockfd, in_buf, 2*NIQ, MSG_WAITALL)) > 0){
    //        printf("\nn= %d; NIQ= %d\n",n,NIQ); //n adalah jumlah byte yg terbaca
    proces_buff(n/2, in_buf); // n=600.000; NIQ=300000
  }
  return n;

 }

int main()  // before start:  run rtl_tcp.exe -f 162e6 -s 300000 -a 127.0.0.1 -p 2345 -g 48.0
 {


   char dir_ais[100];

   time_t t = time(NULL);
   struct tm tm = *localtime(&t);

  if (signal(SIGINT, sig_handler) == SIG_ERR){
  printf("\ncan't catch SIGINT\n");
  exit(-1);
  }

  sprintf(dir_ais,"./%d_%d_%d_%d_%d_%d.txt",tm.tm_year+1900, tm.tm_mon + 1, tm.tm_mday, tm.tm_hour, tm.tm_min, tm.tm_sec);
  //   if((fp_ais=fopen(dir_ais,"w"))==NULL){
  //     printf("file %s open error\n",dir_ais);
  //     exit(-1);
  //   }

   //   int r = tcp_recv("127.0.0.1", "2345"); 
  //   int r = tcp_recv(fp_ais); 
   int r = tcp_recv(); 
   printf("\n status = %d \n", r);
   return 0;
 }

double jarak(double lat2, double lon2)
{
  double a,b,c,d;

  //  printf("lat2= %lf; lon2= %lf\n",lat2,lon2);
  a=cos(lat1*dpi)*cos(lat2*dpi)*cos(lon1*dpi)*cos(lon2*dpi);
  b=cos(lat1*dpi)*sin(lon1*dpi)*cos(lat2*dpi)*sin(lon2*dpi);	
  c=sin(lat1*dpi)*sin(lat2*dpi);
  d=(acos(a+b+c))*REARTH;
  return d;
}
