import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Browser } from '@capacitor/browser';
import { Clipboard } from '@capacitor/clipboard';
import { AlertController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { WebpayService } from 'src/app/services/paymentService/webpay.service';

@Component({
  selector: 'app-webpay-peticion',
  templateUrl: './webpay-peticion.component.html',
  styleUrls: ['./webpay-peticion.component.scss'],
})
export class WebpayPeticionComponent implements OnInit {
  dataPago!: any[];
  suma: number = 0;
  idBoleta: string = '';
  numeroFormateado: string = '';
  metodoPago: string = 'transferencia';
  correo: string = '';
  isLoading: boolean = false;

  constructor(
    private webpayService: WebpayService,
    private activeroute: ActivatedRoute,
    private router: Router,
    public toastController: ToastController,
    public alertController: AlertController,
  ) {
    this.activeroute.queryParams.subscribe(params => {
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras.state) {
        this.dataPago = navigation.extras.state['dataPago'];
        this.idBoleta = this.dataPago.map(item => item.id).join('-');
      } else {
        this.router.navigate(["/home/finance"]);
      }
    });
  }

  ngOnInit(): void {
    this.suma = this.dataPago.reduce((acc, item) => acc + Number(item.mount), 0);
    const formatter = new Intl.NumberFormat('cl-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    });
    this.numeroFormateado = formatter.format(this.suma);
  }

  async goPagar(): Promise<void> {
    this.isLoading = true;
    if (this.metodoPago === 'webpay') {
      await this.pagarConWebpay();
    } else if (this.metodoPago === 'transferencia') {
      await this.pagarConTransferencia();
    }
    this.isLoading = false;
  }

  async pagarConWebpay(): Promise<void> {
    const rutApoderadoAmbiente = localStorage.getItem('rutAmbiente');
    const { v4: uuidv4 } = require('uuid');
    const uuid = uuidv4();
    const longitudDeseada = 4;
    const buyOrderId = rutApoderadoAmbiente + "-" + uuid.substring(0, longitudDeseada) + '-' + this.idBoleta;

    const data = {
      "amount": this.suma,
      "buyOrder": buyOrderId,
      "sessionId": rutApoderadoAmbiente!.toString(),
      "returnUrl": "https://www.colegioandeschile.cl/webpay-respuesta"
    };

    try {
      const response = await firstValueFrom(this.webpayService.webpayCrearOrden(data));
      if (response) {
        console.log(response);
        await Browser.open({ url: `${response.url}?token_ws=${response.token}` });
        this.router.navigate(["/home"]);
      } else {
        console.error('No se recibió respuesta de la API de Webpay.');
      }
    } catch (error) {
      console.log(error);
    }
  }

  async pagarConTransferencia(): Promise<void> {
    if (!this.correo) {
      this.presentToast('Por favor, proporciona un correo electrónico para la confirmación.');
      return;
    }

    const confirmed = await this.presentAlertConfirm("Pregunta", `¿Estás seguro/a de esta acción?`);
    if (!confirmed) {
      return;
    }

    const rutApoderadoAmbiente = localStorage.getItem('rutAmbiente');
    const { v4: uuidv4 } = require('uuid');
    const uuid = uuidv4();
    const longitudDeseada = 4;
    const buyOrderId = `${rutApoderadoAmbiente}-${uuid.substring(0, longitudDeseada)}-${this.idBoleta}`;

    const data = {
      buy_order: buyOrderId,
      correo: this.correo,
    };

    try {
      this.webpayService.confirmarTransferencia(data).subscribe({
        next: (response: any) => {
          console.log(response);
          this.presentAlertOK("Información", `Tu solicitud de pago será revisada por el departamento de finanzas. Ellos confirmarán el pago de las boletas seleccionadas (<b>N° ${this.idBoleta}</b>) por un monto de <b>$ ${this.numeroFormateado}</b> y te enviarán un correo con el comprobante de pago a <b>${this.correo}</b> dentro de las próximas 24 horas.`);
        },
        error: (error: any) => {
          console.error('Error al confirmar transferencia:', error);
          this.presentToast('Error al confirmar transferencia. Por favor, inténtalo de nuevo.');
        }
      });
    } catch (error) {
      console.error('No se recibió respuesta de la API.');
      this.presentToast('Error de comunicación con la API. Por favor, inténtalo de nuevo.');
    }
  }

  async presentAlertConfirm(header: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: 'No',
            role: 'cancel',
            cssClass: 'alert-button-cancel',
            handler: () => {
              console.log('Alert Cancelled');
              resolve(false);
            },
          },
          {
            text: 'Sí',
            role: 'confirm',
            cssClass: 'alert-button-confirm',
            handler: () => {
              resolve(true);
            },
          },
        ],
      });
      await alert.present();
    });
  }

  async copiarDatosTransferencia(): Promise<void> {
    const datos = `Banco: Scotiabank
      Cuenta Corriente N°: 58011401
      Titular: Sociedad Educacional Colegio Andes Chile
      RUT: 77.625.500-9
      Correo: oficina.andeschile@gmail.com
    `;
    await Clipboard.write({
      string: datos
    });
    this.presentToast('Datos de transferencia copiados con exito!!');
  }

  async presentToast(msg: string, duracion?: number) {
    const toast = await this.toastController.create({
      message: msg,
      duration: duracion ? duracion : 2000,
      position: 'top',
    });
    toast.present();
  }

  async presentAlertOK(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message: '',
      buttons: [
        {
          text: 'Okay',
          handler: () => {
            this.router.navigate(["/home"]);
          },
        },
      ],
    });
    alert.message = message;
    await alert.present();
  }
}
