import { useState } from "react";
import { FaTimes, FaCheck, FaSearch, FaTable, FaFileExport } from "react-icons/fa"
import axios from "axios";

export default function ChequeForm() {

  const [file, setFile] = useState<File | null>(null);
  const [fileId, setFileId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [pagination, setPagination] = useState<{ next: string | null; previous: string | null }>({ next: null, previous: null });
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const [form, setForm] = useState({
    chequeNumber: "",
    recipient: "",
    amount: "",
    amountInWords: "",
    date: "",
    place: "LA UNIÓN,"
  });

  const generatePDF = async () => {
    const pdfData = {
      beneficiario: form.recipient,
      monto: form.amount,
      monto_letras: form.amountInWords,
      fecha: form.date,
      lugar: form.place,
    };

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/generate-check/",
        pdfData,
        {
          responseType: "blob", // Indicar que la respuesta es un archivo binario
        }
      );
  
      // Crear una URL para el PDF
      const url = window.URL.createObjectURL(response.data); // Usar response.data directamente
      setPdfUrl(url); // Almacenar la URL en el estado
    } catch (error) {
      console.error("Error al generar el PDF:", error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      console.log("Archivo seleccionado:", selectedFile);
      setFile(selectedFile);
    } else {
      console.error("No se seleccionó ningún archivo.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }

    try {
      // Subir el archivo y obtener el file_id
      const uploadResponse = await axios.post("http://127.0.0.1:8000/api/upload-excel/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFileId(uploadResponse.data.file_id); // Almacenar el file_id
      console.log("File ID:", uploadResponse.data.file_id);

      // Obtener la primera página de datos
      const paginationResponse = await axios.post("http://127.0.0.1:8000/api/pagination-excel/", {
        file_id: uploadResponse.data.file_id,
        page: 1,
      });
      setData(paginationResponse.data.results);
      setPagination({
        next: paginationResponse.data.next,
        previous: paginationResponse.data.previous,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handlePagination = async (url: string | null) => {
    if (!url || !fileId) {
      console.error("No hay URL de paginación o file_id.");
      return;
    }

    try {
      const response = await axios.post(url, { file_id: fileId });
      setData(response.data.results);
      setPagination({
        next: response.data.next,
        previous: response.data.previous,
      });
    } catch (error) {
      console.error("Error fetching paginated data:", error);
    }
  };

  const handleSelect = async (item) => {

    const amountInWords = await axios.post("http://127.0.0.1:8000/api/convert-number-word/", {
      amount: item.importe_soles,
    });

    setForm({
      ...form,
      chequeNumber: item.numero_cheque,
      recipient: item.beneficiario,
      amount: item.importe_soles,
      date: item.fecha,
      amountInWords: amountInWords.data.amount_letters,
    });
    toggleModal();
  };

  const [isOpen, setIsOpen] = useState(false);

  const toggleModal = () => {
    setIsOpen(!isOpen);
  };

  return (

    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-5/6 mx-auto px-8 py-6 bg-white shadow-lg rounded-md">
        <h2 className="text-xl font-bold mb-4 text-left">Gestión de cheques</h2>
        <div className="flex justify-between space-x-4">
          <div className="w-1/2">
            <form action="" className="space-y-4 mb-8">


              <label className="block text-sm font-medium" htmlFor="file_input">Upload Excel File</label>
              <input className="w-full 
              rounded-md border border-input 
              bg-background p-2 text-sm file:text-sm file:font-medium placeholder:text-muted-foreground 
              focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                type="file"
                accept=".xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange} />

              <button
                type="button"
                onClick={handleSubmit}
                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                <FaFileExport className="inline-block mr-2" />
                SUBIR
              </button>

            </form>

            <form action="" method="post" className="space-y-4 mb-8">
              <div className="space-y-4">
                <div>
                  <label htmlFor="chequeNumber" className="block text-sm font-medium">Buscar Por Número de Cheque</label>
                  <input
                    type="text"
                    name="chequeNumber"
                    value={form.chequeNumber}
                    onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                    className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                  />
                </div>
                <button className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                  <FaSearch className="inline-block mr-2" />
                  BUSCAR
                </button>

                <button
                  onClick={toggleModal}
                  type="button"
                  className="bg-blue-500 text-white px-4 py-2 ml-2 rounded-md hover:bg-blue-600">
                  <FaTable className="inline-block mr-2" />
                  Buscar en tabla
                </button>
              </div>
            </form>

            {isOpen && (
              <div id="large-modal" tabIndex={-1} className="fixed inset-0 z-50 overflow-y-auto bg-white bg-opacity-50 flex items-center justify-center">
                <div className="relative w-full max-w-4xl max-h-full">

                  <div className="relative bg-white rounded-lg shadow-sm">
                    <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                      <h3 className="text-xl font-medium text-gray-900">
                        Reporte - Nota pagos
                      </h3>
                      <button onClick={toggleModal} type="button" className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" data-modal-hide="large-modal">
                        <FaTimes />
                        <span className="sr-only">Close modal</span>
                      </button>
                    </div>



                    <div className="p-4 md:p-5 space-y-4">

                      <form action="" className="flex space-x-4 mb-4">
                        <div>
                          <label htmlFor="chequeNumber" className="block text-sm font-medium">Buscar</label>
                          <input
                            type="text"
                            name="chequeNumber"
                            value={form.chequeNumber}
                            onChange={(e) => setForm({ ...form, chequeNumber: e.target.value })}
                            className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                          />
                        </div>
                        <button className="self-end bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600">
                          <FaSearch className="inline-block mr-2" />
                          BUSCAR
                        </button>
                      </form>
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="border border-gray-300 px-4 py-2">Nro de cheque</th>
                            <th className="border border-gray-300 px-4 py-2">Destinatario</th>
                            <th className="border border-gray-300 px-4 py-2">Monto</th>
                            <th className="border border-gray-300 px-4 py-2">Fecha</th>
                            <th className="border border-gray-300 px-4 py-2">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((item) => (
                            <tr className="text-center text-sm p-2" key={item.id}>
                              <td className="border border-gray-300 py-2">{item.numero_cheque}</td>
                              <td className="border border-gray-300 py-2">{item.beneficiario}</td>
                              <td className="border border-gray-300 py-2">{item.importe_soles}</td>
                              <td className="border border-gray-300 py-2">{item.fecha}</td>
                              <td className="border border-gray-300 py-2">
                                <button type="button" onClick={() => handleSelect(item)} className="bg-yellow-500 text-sm text-white px-2 py-1 rounded-md hover:bg-yellow-600">
                                  <FaCheck className="inline-block mr-2" />
                                  SELECCIONAR
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-between mt-4">
                        <button
                          type="button"
                          onClick={() => handlePagination(pagination.previous)}
                          disabled={!pagination.previous}
                          className={`px-4 py-2 rounded-md ${pagination.previous ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                          Anterior
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePagination(pagination.next)}
                          disabled={!pagination.next}
                          className={`px-4 py-2 rounded-md ${pagination.next ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300 cursor-not-allowed"
                            }`}
                        >
                          Siguiente
                        </button>
                      </div>



                    </div>

                    <div className="flex items-center p-4 md:p-5 space-x-3 rtl:space-x-reverse border-t border-gray-200 rounded-b dark:border-gray-600">
                      <button type="button" onClick={toggleModal} className="text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Cerrar</button>
                    </div>

                  </div>




                </div>
              </div>
            )}


            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Destinatario</label>
                <input
                  type="text"
                  name="recipient"
                  value={form.recipient}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Monto</label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Monto en Letras</label>
                <input
                  type="text"
                  name="amountInWords"
                  value={form.amountInWords}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Fecha</label>
                <input
                  type="text"
                  name="date"
                  value={form.date}
                  pattern="\d{2}/\d{2}/\d{4}"
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Lugar</label>
                <input
                  type="text"
                  name="place"
                  value={form.place}
                  onChange={handleChange}
                  className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring focus:ring-blue-300"
                />
              </div>
              <div>
                <button type="button" onClick={generatePDF} className="bg-cyan-500 text-white px-4 py-2 rounded-md hover:bg-cyan-600">
                  <FaFileExport className="inline-block mr-2" />
                  GENERAR
                </button>
              </div>
            </form>
          </div>
          <div className="w-1/2">
            <div className="border rounded-md p-4 border-gray-300">
              <h2 className="text-xl font-bold mb-2 text-left">Cheque</h2>
              {pdfUrl ? (<iframe
                src={pdfUrl}
                className="w-full h-dvh border rounded-md"
                title="PDF Viewer"
              ></iframe>) : (
                <p className="text-center text-lg text-gray-400">No hay PDF generado</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
