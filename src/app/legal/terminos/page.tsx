// app/legal/terminos/page.tsx
"use client";

import Link from "next/link";

export default function Terminos() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 prose prose-invert">
      <h1>Términos y Condiciones</h1>
      <p><em>Vigentes desde: {new Date().toLocaleDateString("es-AR")}</em></p>

      <p>
        Estos Términos regulan el uso de <strong>NaruTrad</strong>, incluyendo el sitio y el Studio.
        Al acceder o usar el servicio, aceptás estos Términos.
      </p>

      <h2>1. Servicio</h2>
      <ul>
        <li>NaruTrad es una herramienta para acelerar la traducción de páginas de manga mediante selección de globos (ROI), OCR y traducción automática.</li>
        <li>Es un <strong>MVP en beta</strong>: pueden existir cambios, límites de uso y períodos de indisponibilidad.</li>
      </ul>

      <h2>2. Cuenta y seguridad</h2>
      <ul>
        <li>Sos responsable de la confidencialidad de tus credenciales y de las actividades realizadas en tu cuenta.</li>
        <li>No compartas tu cuenta ni intentes eludir límites técnicos (p. ej., uso automatizado o masivo sin autorización).</li>
      </ul>

      <h2>3. Créditos, precios y reembolsos</h2>
      <ul>
        <li>El procesamiento consume <strong>créditos</strong> (por ejemplo, 1 crédito por globo traducido). Los packs de créditos son prepagos.</li>
        <li>Podemos ajustar precios y paquetes durante el MVP. Los cambios se aplicarán de forma prospectiva.</li>
        <li>En caso de interrupciones prolongadas atribuibles al servicio, podremos otorgar créditos de cortesía a nuestro criterio.</li>
      </ul>

      <h2>4. Contenido del usuario</h2>
      <ul>
        <li>Conservás tus derechos sobre las imágenes que subas y los textos que generes. Nos otorgás una licencia limitada para procesarlas con fines de prestación del servicio.</li>
        <li>No subas contenido ilegal, que infrinja derechos de terceros, o que viole normas aplicables (incluida propiedad intelectual y privacidad).</li>
        <li>Si sos titular de derechos y creés que tu obra se usa indebidamente, escribinos para solicitar retiro.</li>
      </ul>

      <h2>5. Propiedad intelectual</h2>
      <ul>
        <li>NaruTrad, su logo, código y componentes son propiedad de sus titulares. No se otorgan licencias salvo lo expresamente indicado.</li>
        <li>Podés usar los textos generados para tus fines lícitos (incluida edición posterior), respetando derechos de terceros.</li>
      </ul>

      <h2>6. Uso aceptable y anti‑abuso</h2>
      <ul>
        <li>Prohibido automatizar el uso o realizar scraping sin permiso.</li>
        <li>Prohibido eludir o intentar eludir límites de créditos, rate‑limits o mecanismos de seguridad.</li>
        <li>Prohibido subir material que viole la ley o derechos de autor; podremos suspender cuentas que incurran en abusos.</li>
      </ul>

      <h2>7. Terceros y procesamiento</h2>
      <p>
        Usamos procesadores como Supabase y servicios de Google (Vision/Gemini). El procesamiento se rige por sus términos además de los nuestros.
      </p>

      <h2>8. Disponibilidad y cambios</h2>
      <ul>
        <li>El servicio se brinda “tal cual” y “según disponibilidad”. No garantizamos continuidad ni resultados específicos.</li>
        <li>Podemos modificar o descontinuar funciones. Notificaremos cambios materiales cuando corresponda.</li>
      </ul>

      <h2>9. Limitación de responsabilidad</h2>
      <p>
        En la máxima medida permitida por la ley, NaruTrad no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o imposibilidad de uso.
      </p>

      <h2>10. Terminación</h2>
      <ul>
        <li>Podemos suspender o cerrar cuentas que violen estos Términos o que representen riesgo para el servicio.</li>
        <li>Podés solicitar la baja en cualquier momento; podés exportar tus datos guardados antes de cerrar la cuenta.</li>
      </ul>

      <h2>11. Ley aplicable</h2>
      <p>
        Salvo que la ley local disponga lo contrario, estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a los tribunales competentes del domicilio del titular del servicio.
      </p>

      <h2>12. Contacto</h2>
      <p>
        Consultas legales: <a href="mailto:hola@narutrad.app">hola@narutrad.app</a>
      </p>

      <hr />

      <p>
        <Link href="/legal/privacidad">Ver Política de Privacidad →</Link>
      </p>
    </main>
  );
}
