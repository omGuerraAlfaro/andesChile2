import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, catchError, throwError } from 'rxjs';
import { environment } from 'src/environments/environment.prod';
import { IAnotaciones } from 'src/interfaces/AnotacionInterface';
import { EstudianteConBoletas, IEstudiante } from 'src/interfaces/apoderadoInterface';

@Injectable({
  providedIn: 'root'
})
export class EstudianteService {

  httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    })
  };

  constructor(private http: HttpClient) { }

  getInfoEstudiante(rut: any): Observable<IEstudiante> {
    return this.http.get<IEstudiante>(`${environment.api}/estudiante/rut/${rut}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
  getInfoEstudiante2(rut: any): Observable<EstudianteConBoletas> {
    return this.http.get<EstudianteConBoletas>(`${environment.api}/estudiante/rut/${rut}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }
  getAnotacionesEstudiante(id: any): Observable<IAnotaciones[]> {
    return this.http.get<IAnotaciones[]>(`${environment.api}/anotaciones/estudiante/${id}`, this.httpOptions)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: any) {
    let errorMessage = 'An error occurred: ' + error.message;
    console.error(errorMessage);
    // Aquí podrías implementar una lógica adicional para manejar diferentes tipos de errores.
    return throwError(() => new Error(errorMessage));
  }


  private currentStudentSubject = new BehaviorSubject<IEstudiante | null>(null);
  currentStudent$ = this.currentStudentSubject.asObservable();
  
  // Método para actualizar el estudiante actual
  setCurrentStudent(student: IEstudiante) {
    this.currentStudentSubject.next(student);
  }
}
