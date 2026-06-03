// src/services/PubChemService.ts

export interface PubChemMolecule {
    cid: number
    name: string
    formula: string
    molecularWeight: number
    iupacName: string
    sdf3D?: string
}

export class PubChemService {
    private static readonly BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'

    /**
     * Busca uma molécula pelo nome no PubChem
     */
    static async searchByName(name: string): Promise<PubChemMolecule | null> {
        try {
            // 1. Buscar metadados e CID
            const res = await fetch(`${this.BASE_URL}/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`)
            if (!res.ok) return null

            const data = await res.json()
            const prop = data.PropertyTable.Properties[0]
            if (!prop) return null

            const molecule: PubChemMolecule = {
                cid: prop.CID,
                name: name,
                formula: prop.MolecularFormula,
                molecularWeight: parseFloat(prop.MolecularWeight),
                iupacName: prop.IUPACName
            }

            // 2. Buscar SDF 3D se disponível
            try {
                const sdfRes = await fetch(`${this.BASE_URL}/compound/cid/${prop.CID}/record/SDF/?record_type=3d`)
                if (sdfRes.ok) {
                    molecule.sdf3D = await sdfRes.text()
                } else {
                    // Tenta o 2D se não tiver 3D
                    const sdf2dRes = await fetch(`${this.BASE_URL}/compound/cid/${prop.CID}/record/SDF/?record_type=2d`)
                    if (sdf2dRes.ok) molecule.sdf3D = await sdf2dRes.text()
                }
            } catch (err) {
                console.warn('Falha ao obter SDF do PubChem:', err)
            }

            return molecule
        } catch (error) {
            console.error('Erro na busca do PubChem:', error)
            return null
        }
    }
}
