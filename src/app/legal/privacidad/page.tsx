// app/legal/privacidad/page.tsx
"use client";

import Link from "next/link";

export default function Privacidad() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Política de Privacidad</h1>
      <p><em>Vigente desde: {new Date().toLocaleDateString("es-AR")}</em></p>

      <p>
        Esta Política describe cómo <strong>NaruTrad</strong> (la “Plataforma”) recopila, usa y protege
        tu información al utilizar nuestro sitio y la aplicación de traducción de mangas (el “Studio”).
        Al usar NaruTrad, aceptás esta Política.
      </p>

      <h2>1. Quiénes somos</h2>
      <p>
        NaruTrad es un MVP en beta pública enfocado en acelerar el flujo de traducción de páginas de manga
        mediante selección de globos (ROI), <strong>OCR</strong> y traducción automática.
      </p>

      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li><strong>Cuenta</strong>: email, nombre (si lo completás), fecha de alta, estado y <em>user id</em>.</li>
        <li><strong>Uso y créditos</strong>: cantidad de globos/páginas procesados, fecha y hora, origen/target (JA→ES/EN→ES),
          proveedor/modelo utilizado, consumo de créditos y eventos de facturación cuando corresponda.</li>
        <li><strong>Historial</strong> (limitado): según tu configuración, podemos guardar referencias a items de un trabajo
          (ids internos, conteos y texto generado). <u>Por defecto, no almacenamos las imágenes subidas ni el texto del OCR</u> una vez finalizado el proceso.</li>
        <li><strong>Soporte</strong>: mensajes que nos envíes por email o formularios.</li>
        <li><strong>Cookies esenciales</strong>: necesarias para autenticación y seguridad. No usamos cookies de marketing.
        </li>
      </ul>

      <h2>3. Para qué usamos los datos</h2>
      <ul>
        <li>Proveer y operar el Studio (autenticación, control de créditos, prevención de abuso).</li>
        <li>Mejorar el servicio (métricas agregadas, depuración y seguridad).</li>
        <li>Facturación y atención al cliente.</li>
        <li>Cumplimiento legal y respuesta a requerimientos válidos de autoridades.</li>
      </ul>

      <h2>4. Procesadores y terceros</h2>
      <p>Utilizamos proveedores para operar el MVP; p. ej.:</p>
      <ul>
        <li><strong>Supabase</strong> (autenticación y base de datos).</li>
        <li><strong>Google Cloud Vision</strong> (OCR).</li>
        <li><strong>Gemini (Google)</strong> / proveedor equivalente para traducción automática.</li>
        <li>Infraestructura de hosting y correo transaccional.</li>
      </ul>
      <p>
        Estos terceros procesan datos en nuestro nombre conforme a sus propias políticas. No venden tu información.
      </p>

      <h2>5. Retención</h2>
      <ul>
        <li><strong>Imágenes y OCR</strong>: por defecto se procesan en memoria y se descartan al finalizar.</li>
        <li><strong>Métricas/uso</strong>: se conservan por necesidad operativa y contable.</li>
        <li><strong>Historial</strong>: si activás guardado de resultados, se mantiene hasta que lo borres o cierre de cuenta.</li>
      </ul>

      <h2>6. Seguridad</h2>
      <p>
        Aplicamos medidas razonables para proteger la información (control de acceso, cifrado en tránsito, registro de eventos),
        pero ningún sistema es 100% seguro. Recomendamos usar contraseñas robustas y no compartir tu cuenta.
      </p>

      <h2>7. Tus derechos</h2>
      <p>
        Podés acceder, corregir o borrar tus datos personales, así como solicitar la baja de tu cuenta.
        Si residís en jurisdicciones con derechos ampliados (por ejemplo, UE), podés ejercer los correspondientes
        a acceso, rectificación, limitación, portabilidad y oposición en la medida aplicable.
      </p>

      <h2>8. Menores</h2>
      <p>NaruTrad no está dirigido a menores de 13 años. Si sos menor de edad, usá el servicio con autorización de un adulto.</p>

      <h2>9. Cambios</h2>
      <p>
        Podemos actualizar esta Política. Publicaremos la versión vigente con la fecha de “Vigente desde”.
      </p>

      <h2>10. Contacto</h2>
      <p>
        Escribinos a <a href="mailto:hola@narutrad.app">hola@narutrad.app</a> para consultas sobre privacidad.
      </p>

      <hr />
      <p>
        <Link href="/legal/terminos">Ver Términos y Condiciones →</Link>
      </p>
    </main>
  );
}

